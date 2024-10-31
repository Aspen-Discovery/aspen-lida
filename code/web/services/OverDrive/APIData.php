<?php
require_once ROOT_DIR . '/Action.php';
require_once ROOT_DIR . '/services/Admin/Admin.php';

class OverDrive_APIData extends Admin_Admin {
	function launch() : void {
		global $interface;
		global $library;
		require_once ROOT_DIR . '/sys/OverDrive/OverDriveSetting.php';
		require_once ROOT_DIR . '/Drivers/OverDriveDriver.php';
		$setting = new OverDriveSetting();
		$setting->orderBy('name');
		$setting->find();
		$allSettings = [];
		while ($setting->fetch()) {
			$allSettings[$setting->id] = clone $setting;
		}
		$interface->assign('allSettings', $allSettings);

		$driver = new OverDriveDriver();

		if (isset($_REQUEST['settingId'])) {
			$activeSetting = $allSettings[$_REQUEST['settingId']];
		} else {
			$libraryScopes = $library->getOverdriveScopeObjects();
			if (!empty($libraryScopes)) {
				$firstScope = reset($libraryScopes);
				$activeSetting = $allSettings[$firstScope->settingId];
			} else {
				$activeSetting = reset($allSettings);
			}
		}

		$driver->setSettings($activeSetting);
		$interface->assign('selectedSettingId', $activeSetting->id);

		$contents = '';
		$tokenData = $driver->getTokenData($library, $activeSetting);
		if ($tokenData === false) {
			$contents .= "<strong>Could not connect to the APIs.  Please check the OverDrive settings.</strong>";
		} else {
			$contents .= "<h1>Token</h1>";
			$contents .= '<div>Connection Scope: ' . $tokenData->scope . '</div>';
		}

		$libraryInfo = $driver->getLibraryAccountInformation($library, $activeSetting);
		if ($libraryInfo == null) {
			$contents .= "<strong>No Library Information Returned.  Please check the OverDrive settings.</strong>";
		} else {
			$contents .= "<h1>Main - $libraryInfo->name</h1>";
			$contents .= $this->easy_printr('Library Account Information', 'libraryAccountInfo', $libraryInfo);

			$advantageAccounts = null;
			try {
				$advantageAccounts = $driver->getAdvantageAccountInformation($library, $activeSetting);
				if ($advantageAccounts && !empty($advantageAccounts->advantageAccounts)) {
					$contents .= "<h1>Advantage Accounts</h1>";
					$contents .= $this->easy_printr('Advantage Account Information', 'advantageAccountInfo', $advantageAccounts);
					$contents .= "<br/>";
					foreach ($advantageAccounts->advantageAccounts as $accountInfo) {
						$contents .= $accountInfo->name . ' - ' . $accountInfo->collectionToken . '<br/>';
					}
				} else {
					$contents .= "<div>No advantage accounts for this collection</div>";
				}
			} catch (Exception $e) {
				$contents .= "Error retrieving Advantage Info $e";
			}

			$productKey = $libraryInfo->collectionToken;

			if (!empty($_REQUEST['id'])) {
				$overDriveId = $_REQUEST['id'];
				$interface->assign('overDriveId', $overDriveId);
				$contents .= "<h2>Metadata</h2>";
				$contents .= "<h3>Metadata for $overDriveId</h3>";
				$metadata = $driver->getProductMetadata($library, $activeSetting, $overDriveId, $productKey);
				if ($metadata) {
					$contents .= $this->easy_printr("Metadata for $overDriveId in shared collection", "metadata_{$overDriveId}_$productKey", $metadata);
				} else {
					$contents .= ("No metadata<br/>");
				}

				$contents .= "<h2>Availability</h2>";
				$contents .= ("<h3>Availability for Main collection: $libraryInfo->name</h3>");
				$availability = $driver->getProductAvailability($library, $activeSetting, $overDriveId, $productKey);
				if ($availability && !isset($availability->errorCode)) {
					$contents .= ("Copies Owned: $availability->copiesOwned <br/>");
					$contents .= ("Available Copies: $availability->copiesAvailable<br/>");
					$contents .= ("Num Holds (entire collection): $availability->numberOfHolds<br/>");
					$contents .= $this->easy_printr("Availability response", "availability_{$overDriveId}_$productKey", $availability);
				} else {
					$contents .= ("Not owned<br/>");
					if ($availability) {
						$contents .= $this->easy_printr("Availability response", "availability_{$overDriveId}_$productKey", $availability);
					}
				}

				if ($advantageAccounts && !empty($advantageAccounts->advantageAccounts)) {
					foreach ($advantageAccounts->advantageAccounts as $accountInfo) {
						$contents .= ("<h3>Availability - $accountInfo->name ($accountInfo->id)</h3>");
						$availability = $driver->getProductAvailability($library, $activeSetting, $overDriveId, $accountInfo->collectionToken);
						if ($availability && !isset($availability->errorCode)) {
							$contents .= ("Copies Owned (Shared Plus advantage): $availability->copiesOwned<br/>");
							$contents .= ("Available Copies (Shared Plus advantage): $availability->copiesAvailable<br/>");
							$contents .= ("Num Holds (Shared Plus advantage): $availability->numberOfHolds<br/>");
							$contents .= $this->easy_printr("Availability response", "availability_{$overDriveId}_$accountInfo->collectionToken", $availability);
						} else {
							$contents .= ("Not owned<br/>");
							if ($availability) {
								$contents .= $this->easy_printr("Availability response", "availability_{$overDriveId}_$accountInfo->collectionToken", $availability);
							}
						}
					}
				}
			}
		}

		$readerName = new OverDriveDriver();
		$readerName = $readerName->getReaderName();

		$interface->assign('readerName', $readerName);

		$interface->assign('overDriveAPIData', $contents);
		$this->display('overdriveApiData.tpl', 'OverDrive API Data');
	}

	function easy_printr($title, $section, $var) : string {
		$contents = "<a onclick='$(\"#$section\").toggle();return false;' href='#'>$title</a>";
		$contents .= "<pre style='display:none' id='$section'>";
		$contents .= print_r($var, true);
		$contents .= '</pre>';
		return $contents;
	}

	function getBreadcrumbs(): array {
		$readerName = new OverDriveDriver();
		$readerName = $readerName->getReaderName();
		$breadcrumbs = [];
		$breadcrumbs[] = new Breadcrumb('/Admin/Home', 'Administration Home');
		$breadcrumbs[] = new Breadcrumb('/Admin/Home#overdrive', $readerName);
		$breadcrumbs[] = new Breadcrumb('/OverDrive/APIData', 'API Information');
		return $breadcrumbs;
	}

	function getActiveAdminSection(): string {
		return 'overdrive';
	}

	function canView(): bool {
		return UserAccount::userHasPermission('View OverDrive Test Interface');
	}
}