<?php

require_once ROOT_DIR . '/services/Admin/Admin.php';

class Testing_GenerateMaterialRequests extends Admin_Admin {
	function launch() : void {
		global $interface;
		$user = UserAccount::getActiveUserObj();
		if (!empty($user->updateMessage)) {
			$interface->assign('updateMessage', $user->updateMessage);
			$interface->assign('updateMessageIsError', $user->updateMessageIsError);
			$user->updateMessage = '';
			$user->updateMessageIsError = 0;
			$user->update();
		}

		if (isset($_REQUEST['generateMaterialRequests'])) {
			require_once ROOT_DIR . '/sys/Utils/SystemUtils.php';
			$additionalParameters = [];
			$additionalParameters[] = $_REQUEST['generationType'];
			$additionalParameters[] = $_REQUEST['numberOfYears'] ?? 1;
			$additionalParameters[] = $_REQUEST['minEntriesPerMonth'] ?? 0;
			$additionalParameters[] = $_REQUEST['maxEntriesPerMonth'] ?? 10;
			$additionalParameters[] = $_REQUEST['clearExistingMaterialRequests'] ?? 0;

			if ($_REQUEST['generationType'] == '3') {
				$additionalParameters[] = $_REQUEST['patronBarcode'] ?? '';
			}


			$result = SystemUtils::startBackgroundProcess("generateMaterialRequests", $additionalParameters);

			$activeUser = UserAccount::getActiveUserObj();
			if ($result['success']) {
				$updateMessage = translate(['text'=>'Successfully started background process %1% to generate material requests.', 1=>$result['backgroundProcessId'], 'isAdminFacing' => true]);
			}else{
				$updateMessage = translate(['text'=>'Could not start background process to generate material requests.', 'isAdminFacing' => true]) . "<br/> " . $result['message'];
			}
			$activeUser->__set('updateMessage', $updateMessage);
			$activeUser->__set('updateMessageIsError', !$result['success']);

			$activeUser->update();

			header("Location: /Testing/GenerateMaterialRequests");
			die();
		}

		$this->display('generateMaterialRequests.tpl', 'Generate Material Requests', 'Greenhouse/greenhouse-sidebar.tpl');
	}

	function getBreadcrumbs(): array {
		$breadcrumbs = [];
		$breadcrumbs[] = new Breadcrumb('/Greenhouse/Home', 'Greenhouse Home');
		$breadcrumbs[] = new Breadcrumb('/Testing/GenerateMaterialRequests', 'Generate Material Requests', true);
		return $breadcrumbs;
	}

	function canView() : bool {
		if (UserAccount::isLoggedIn()) {
			if (UserAccount::getActiveUserObj()->isAspenAdminUser()) {
				return true;
			}
		}
		return false;
	}

	function getActiveAdminSection(): string {
		return 'greenhouse';
	}
}
