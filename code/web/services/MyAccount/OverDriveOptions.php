<?php

require_once ROOT_DIR . '/services/MyAccount/MyAccount.php';

class MyAccount_OverDriveOptions extends MyAccount {
	function launch() : void {
		global $interface;
		$user = UserAccount::getLoggedInUser();

		if ($user) {
			$patronHomeLibrary = $user->getHomeLibrary();
			$availableSettings = $patronHomeLibrary->getOverdriveSettings();
			$interface->assign('availableSettings', $availableSettings);

			// Save/Update Actions
			global $offlineMode;
			if (isset($_POST['updateScope']) && !$offlineMode) {
				$user->updateOverDriveOptions();

				session_write_close();
				$actionUrl = '/MyAccount/OverDriveOptions'; // redirect after form submit completion
				header("Location: " . $actionUrl);
				exit();
			} elseif (!$offlineMode) {
				$optionsForSetting = [];
				foreach ($availableSettings as $setting) {
					$optionsForSetting[$setting->id] = $user->getOverDriveOptions($setting->id);
				}
				$interface->assign('optionsBySetting', $optionsForSetting);
				$interface->assign('edit', true);
			} else {
				$interface->assign('edit', false);
			}

			$interface->assign('profile', $user);
		}

		$readerName = new OverDriveDriver();
		$readerName = $readerName->getReaderName();
		$interface->assign('readerName', $readerName);

		$this->display('overDriveOptions.tpl', 'Account Settings');
	}

	function getBreadcrumbs(): array {
		$breadcrumbs = [];
		$breadcrumbs[] = new Breadcrumb('/MyAccount/Home', 'Your Account');
		$breadcrumbs[] = new Breadcrumb('', 'OverDrive Options');
		return $breadcrumbs;
	}
}