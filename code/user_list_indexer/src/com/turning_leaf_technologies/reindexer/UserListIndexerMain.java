package com.turning_leaf_technologies.reindexer;

import com.turning_leaf_technologies.config.ConfigUtil;
import com.turning_leaf_technologies.file.JarUtil;
import com.turning_leaf_technologies.logging.LoggingUtil;
import com.turning_leaf_technologies.strings.AspenStringUtils;
import com.turning_leaf_technologies.util.SystemUtils;
import org.apache.logging.log4j.Logger;
import org.ini4j.Ini;

import java.sql.*;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

public class UserListIndexerMain {
	private static Logger logger;

	private static boolean fullReindex = false;

	private static long startTime;
	private static long endTime;
	private static long lastReindexTime;

	private static UserListIndexer listProcessor;

	private static Connection dbConn;

	/**
	 * Starts the re-indexing process
	 *
	 * @param args String[] The server name to index with optional parameter for properties of indexing
	 */
	public static void main(String[] args) {
		//General configuration
		String serverName;
		if (args.length == 0) {
			serverName = AspenStringUtils.getInputFromCommandLine("Please enter the server name");
			if (serverName.isEmpty()) {
				System.out.println("You must provide the server name as the first argument.");
				System.exit(1);
			}
		} else {
			serverName = args[0];
		}

		String processName = "user_list_indexer";
		logger = LoggingUtil.setupLogging(serverName, processName);

		//Get the checksum of the JAR when it was started, so we can stop if it has changed.
		long myChecksumAtStart = JarUtil.getChecksumForJar(logger, processName, "./" + processName + ".jar");
		long timeAtStart = new Date().getTime();

		while (true) {
			startTime = new Date().getTime();

			// Read the base INI file to get information about the server (current directory/cron/config.ini)
			Ini configIni = ConfigUtil.loadConfigFile("config.ini", serverName, logger);

			ListIndexingLogEntry logEntry = initializeIndexer(serverName);

			//Check to see if the jar has changes before processing records, and if so quit
			if (myChecksumAtStart != JarUtil.getChecksumForJar(logger, processName, "./" + processName + ".jar")){
				break;
			}

			//Process lists
			long numListsProcessed = 0;
			try {
				logger.info("Reindexing lists");
				numListsProcessed = listProcessor.processPublicUserLists(fullReindex, lastReindexTime, logEntry);
			} catch (Error e) {
				logEntry.incErrors("Error processing reindex ", e);
			} catch (Exception e) {
				logEntry.incErrors("Exception processing reindex ", e);
			}

			// Send completion information
			endTime = new Date().getTime();
			logEntry.setFinished();
			finishIndexing(logEntry);

			logger.info("Finished Reindex for " + serverName + " processed " + numListsProcessed);
			long endTime = new Date().getTime();
			long elapsedTime = endTime - startTime;
			logger.info("Elapsed Minutes " + (elapsedTime / 60000));

			//Disconnect from the database
			disconnectDatabase(dbConn);

			listProcessor.close();
			listProcessor = null;

			//Check to see if the jar has changes, and if so quit
			if (myChecksumAtStart != JarUtil.getChecksumForJar(logger, processName, "./" + processName + ".jar")){
				break;
			}
			//Check to see if it's between midnight and 1 am and the jar has been running more than 15 hours.  If so, restart just to clean up memory.
			GregorianCalendar nowAsCalendar = new GregorianCalendar();
			Date now = new Date();
			nowAsCalendar.setTime(now);
			if (nowAsCalendar.get(Calendar.HOUR_OF_DAY) <=1 && (now.getTime() - timeAtStart) > 15 * 60 * 60 * 1000 ){
				logger.info("Ending because we have been running for more than 15 hours and it's between midnight and one AM");
				break;
			}
			//Check memory to see if we should close
			if (SystemUtils.hasLowMemory(configIni, logger)){
				logger.info("Ending because we have low memory available");
				break;
			}

			//Pause before running the next export (longer if we didn't get any actual changes)
			System.gc();
			try {
				if (numListsProcessed == 0) {
					Thread.sleep(1000 * 60 * 5);
				} else {
					Thread.sleep(1000 * 60);
				}
			} catch (InterruptedException e) {
				logger.info("Thread was interrupted");
			}
		}

		System.exit(0);
	}

	private static void disconnectDatabase(Connection aspenConn) {
		try {
			aspenConn.close();
		} catch (Exception e) {
			logger.error("Error closing database ", e);
			System.exit(1);
		}
	}

	private static void finishIndexing(ListIndexingLogEntry logEntry) {
		long elapsedTime = endTime - startTime;
		float elapsedMinutes = (float) elapsedTime / (float) (60000);
		logger.info("Time elapsed: " + elapsedMinutes + " minutes");

		try {
			String columnToUpdate = "lastUpdateOfChangedLists";
			if (fullReindex){
				columnToUpdate = "lastUpdateOfAllLists";
			}
			PreparedStatement finishedStatement = dbConn.prepareStatement("UPDATE  list_indexing_settings set runFullUpdate = 0, " + columnToUpdate + " = ?");
			finishedStatement.setLong(1, startTime / 1000);
			finishedStatement.executeUpdate();
			finishedStatement.close();
		} catch (SQLException e) {
			logEntry.incErrors("Unable to update settings with completion time.", e);
		}
	}

	private static ListIndexingLogEntry initializeIndexer(String serverName) {
		logger.info("Starting Reindex for " + serverName);

		// Parse the configuration file
		Ini configIni = ConfigUtil.loadConfigFile("config.ini", serverName, logger);

		logger.info("Setting up database connections");
		String databaseConnectionInfo = ConfigUtil.cleanIniValue(configIni.get("Database", "database_aspen_jdbc"));
		if (databaseConnectionInfo == null || databaseConnectionInfo.isEmpty()) {
			logger.error("Database connection information not found in Database Section.  Please specify connection information in database_aspen_jdbc.");
			System.exit(1);
		}
		try {
			dbConn = DriverManager.getConnection(databaseConnectionInfo);
		} catch (SQLException e) {
			logger.error("Could not connect to aspen database", e);
			System.exit(1);
		}

		ListIndexingLogEntry logEntry = createDbLogEntry(dbConn);

		//Load the last Index time
		try {
			PreparedStatement loadSettingsStmt = dbConn.prepareStatement("SELECT * from list_indexing_settings");
			ResultSet loadSettingsRS = loadSettingsStmt.executeQuery();
			if (loadSettingsRS.next()){
				fullReindex = loadSettingsRS.getBoolean("runFullUpdate");
				lastReindexTime = loadSettingsRS.getLong("lastUpdateOfChangedLists");
				long lastFullReindexTime = loadSettingsRS.getLong("lastUpdateOfAllLists");
				//Run a full reindex every 24 hours to make sure that Date Added and Date Updated Facets update properly
				long now = new Date().getTime() / 1000;
				if (now - lastFullReindexTime >  24 * 60 * 60) {
					fullReindex = true;
				}
			}else{
				logEntry.incErrors("No Settings were found for list indexing");
			}
			loadSettingsRS.close();
			loadSettingsStmt.close();
		} catch (Exception e) {
			logEntry.incErrors("Could not load last index time from list_indexing_settings table ", e);
		}

		listProcessor = new UserListIndexer(serverName, configIni, dbConn, logger);

		return logEntry;
	}

	private static ListIndexingLogEntry createDbLogEntry(Connection aspenConn) {
		//Remove log entries older than 45 days
		long earliestLogToKeep = (startTime / 1000) - (60 * 60 * 24 * 45);
		try {
			int numDeletions = aspenConn.prepareStatement("DELETE from list_indexing_log WHERE startTime < " + earliestLogToKeep).executeUpdate();
			logger.info("Deleted " + numDeletions + " old log entries");
		} catch (SQLException e) {
			logger.error("Error deleting old log entries", e);
		}

		//Start a log entry
		ListIndexingLogEntry logEntry = new ListIndexingLogEntry(aspenConn, logger);
		logEntry.saveResults();
		return logEntry;
	}
}
