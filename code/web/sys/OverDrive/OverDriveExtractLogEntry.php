<?php /** @noinspection PhpMissingFieldTypeInspection */

require_once ROOT_DIR . '/sys/BaseLogEntry.php';

class OverDriveExtractLogEntry extends BaseLogEntry {
	public $__table = 'overdrive_extract_log';   // table name
	public $id;
	public $settingId;
	public $notes;
	public $numProducts;
	public $numErrors;
	public $numAdded;
	public $numDeleted;
	public $numUpdated;
	public $numSkipped;
	/** @noinspection PhpUnused */
	public $numAvailabilityChanges;
	/** @noinspection PhpUnused */
	public $numMetadataChanges;
	/** @noinspection PhpUnused */
	public $numInvalidRecords;
}
