<?php
/** @noinspection PhpUnused */
function getUpdates21_07_00() : array
{
	return [
		'indexing_profiles_add_notes_subfield' => [
			'title' => 'Indexing Profile add notes subfield',
			'description' => 'Add Notes Subfield to Indexing Profile',
			'continueOnError' => true,
			'sql' => [
				"ALTER TABLE indexing_profiles ADD COLUMN noteSubfield CHAR(1) default ' '",
				"UPDATE indexing_profiles SET noteSubfield = 'z' WHERE catalogDriver = 'Koha'"
			]
		],
		'indexing_profiles_add_due_date_for_Koha' => [
			'title' => 'Indexing Profile set dueDate for Koha',
			'description' => 'Add Due Date Subfield to Indexing Profile for Koha',
			'continueOnError' => true,
			'sql' => [
				"UPDATE indexing_profiles SET dueDate = 'k' WHERE catalogDriver = 'Koha'"
			]
		],
		'browse_categories_add_startDate_endDate' => [
			'title' => 'Add startDate and endDate to Browse Categories',
			'description' => 'Add startDate and endDate to Browse Categories',
			'sql' => [
				"ALTER TABLE browse_category ADD COLUMN startDate INT(11) DEFAULT 0",
				"ALTER TABLE browse_category ADD COLUMN endDate INT(11) DEFAULT 0",
			]
		],
		'cloud_library_multiple_scopes' => [
			'title' => 'Cloud Library Multiple Scopes',
			'description' => 'Allow multiple scopes to be provided for locations and libraries',
			'continueOnError' => true,
			'sql' => [
				'CREATE TABLE library_cloud_library_scope (
					id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
					scopeId INT NOT NULL,
					libraryId INT NOT NULL,
					unique (libraryId, scopeId)
				) ENGINE InnoDB',
				'CREATE TABLE location_cloud_library_scope (
					id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
					scopeId INT NOT NULL,
					locationId INT NOT NULL,
					unique (locationId, scopeId)
				) ENGINE InnoDB',
				'INSERT INTO library_cloud_library_scope (scopeId, libraryId) SELECT cloudLibraryScopeId, libraryId from library where cloudLibraryScopeId != -1',
				'INSERT INTO location_cloud_library_scope (scopeId, locationId) SELECT cloudLibraryScopeId, locationId from location where cloudLibraryScopeId > 0',
				'INSERT INTO location_cloud_library_scope (scopeId, locationId) SELECT library.cloudLibraryScopeId, locationId from location inner join library on location.libraryId = library.libraryId where location.cloudLibraryScopeId = -1 and library.cloudLibraryScopeId != -1',
				'ALTER TABLE library DROP COLUMN cloudLibraryScopeId',
				'ALTER TABLE location DROP COLUMN cloudLibraryScopeId'
			],
		],
		'indexing_profiles_date_created_polaris' => [
			'title' => 'Indexing Profile set date created for Polaris',
			'description' => 'Add Date Created Subfield to Indexing Profile for Polaris',
			'continueOnError' => true,
			'sql' => [
				"UPDATE indexing_profiles SET dateCreated = 'e' WHERE indexingClass = 'Polaris'",
				"UPDATE indexing_profiles SET dateCreatedFormat = 'yyyy-MM-dd' WHERE indexingClass = 'Polaris'",
			]
		],
		'library_workstation_id_polaris' => [
			'title' => 'Library - Workstation ID',
			'description' => 'Allow Workstation ID to defined at the library level',
			'sql' => [
				"ALTER TABLE library ADD column workstationId VARCHAR(10) DEFAULT ''"
			]
		],
		'regroup_21_07' => [
			'title' => 'Regroup all records for 21.07',
			'description' => 'Regroup all records for 21.07',
			'sql' => [
				'UPDATE indexing_profiles set regroupAllRecords = 1'
			]
		],
		'syndetics_unbound_account_number' => [
			'title' => 'Syndetics Unbound Account Number',
			'description' => 'Add Syndetics Unbound Account Number ',
			'sql' => [
				'ALTER TABLE syndetics_settings ADD COLUMN unboundAccountNumber INT DEFAULT NULL'
			]
		],
		'amazon_ses' => [
			'title' => 'Add Amazon SES information',
			'description' => 'Add the ability to send email via Amazon SES',
			'continueOnError' => true,
			'sql' => [
				'CREATE TABLE amazon_ses_settings (
					id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
					fromAddress VARCHAR(255),
					accessKeyId VARCHAR(50),
					accessKeySecret VARCHAR(256),
					singleMailConfigSet VARCHAR(50),
					bulkMailConfigSet VARCHAR(50),
					region VARCHAR(20)
				) ENGINE INNODB',
				"INSERT INTO permissions (sectionName, name, requiredModule, weight, description) VALUES ('System Administration', 'Administer Amazon SES', '', 29, 'Controls if the user can change Amazon SES settings. <em>This has potential security and cost implications.</em>')",
				"INSERT INTO role_permissions(roleId, permissionId) VALUES ((SELECT roleId from roles where name='opacAdmin'), (SELECT id from permissions where name='Administer Amazon SES'))",
			]
		],
		'increase_showInSearchResultsMainDetails_length' => [
			'title' => 'increase showInSearchResultsMainDetails length',
			'description' => 'Increase the column length for showInSearchResultsMainDetails',
			'sql' => [
				"ALTER TABLE grouped_work_display_settings CHANGE COLUMN showInSearchResultsMainDetails showInSearchResultsMainDetails VARCHAR(512) NULL DEFAULT 'a:5:{i:0;s:10:\"showSeries\";i:1;s:13:\"showPublisher\";i:2;s:19:\"showPublicationDate\";i:3;s:13:\"showLanguages\";i:4;s:10:\"showArInfo\";}'",
			]
		],
		'21_07_00_full_extract_for_koha' => [
			'title' => 'Regroup all records for 21.07',
			'description' => 'Regroup all records for 21.07',
			'sql' => [
				"UPDATE indexing_profiles set runFullUpdate = 1 where indexingClass = 'Koha'"
			]
		],
		'upload_list_cover_permissions' =>[
			'title' => 'Additional Permission to Upload List Covers',
			'description' => 'Additional Permission to Upload List Covers',
			'continueOnError' => true,
			'sql' => [
				"INSERT INTO permissions (sectionName, name, requiredModule, weight, description) VALUES ('User Lists', 'Upload List Covers', '', 1, 'Allows users to upload covers for a list.')",
				"INSERT INTO role_permissions(roleId, permissionId) VALUES ((SELECT roleId from roles where name  = 'opacAdmin'), (SELECT id from permissions where name='Upload List Covers'))",
				"INSERT INTO role_permissions(roleId, permissionId) VALUES ((SELECT roleId from roles where name = 'cataloging'), (SELECT id from permissions where name='Upload List Covers'))",
				"INSERT INTO role_permissions(roleId, permissionId) VALUES ((SELECT roleId from roles where name = 'superCataloger'), (SELECT id from permissions where name='Upload List Covers'))",
				"INSERT INTO role_permissions(roleId, permissionId) VALUES ((SELECT roleId from roles where name = 'listPublisher'), (SELECT id from permissions where name='Upload List Covers'))",
			]
		]
	];
}

