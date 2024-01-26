<?php
require_once ROOT_DIR . '/Action.php';

class EventAPI extends Action {
	function launch() {
		$method = (isset($_GET['method']) && !is_array($_GET['method'])) ? $_GET['method'] : '';

		header('Content-type: application/json');
		header('Cache-Control: no-cache, must-revalidate'); // HTTP/1.1
		header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past

		global $activeLanguage;
		if (isset($_GET['language'])) {
			$language = new Language();
			$language->code = $_GET['language'];
			if ($language->find(true)) {
				$activeLanguage = $language;
			}
		}

		if (isset($_SERVER['PHP_AUTH_USER'])) {
			if ($this->grantTokenAccess()) {
				if (in_array($method, [
					'getEventDetails',
					'saveEvent',
					'removeSavedEvent',
					'getSavedEvents'
				])) {
					header('Cache-Control: max-age=10800');
					require_once ROOT_DIR . '/sys/SystemLogging/APIUsage.php';
					APIUsage::incrementStat('EventAPI', $method);
					$output = json_encode($this->$method());
				} else {
					header('Cache-Control: no-cache, must-revalidate'); // HTTP/1.1
					$output = json_encode(['error' => 'invalid_method']);
				}
			} else {
				header('Cache-Control: no-cache, must-revalidate'); // HTTP/1.1
				header('HTTP/1.0 401 Unauthorized');
				$output = json_encode(['error' => 'unauthorized_access']);
			}
			ExternalRequestLogEntry::logRequest('EventAPI.' . $method, $_SERVER['REQUEST_METHOD'], $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'], getallheaders(), '', $_SERVER['REDIRECT_STATUS'], $output, []);
			echo $output;
		} elseif (IPAddress::allowAPIAccessForClientIP()) {
			if (method_exists($this, $method)) {
				$output = json_encode(['result' => $this->$method()]);
				require_once ROOT_DIR . '/sys/SystemLogging/APIUsage.php';
				APIUsage::incrementStat('EventAPI', $method);
			} else {
				$output = json_encode(['error' => "invalid_method '$method'"]);
			}

			echo $output;
		} else {
			$this->forbidAPIAccess();
		}
	}

	/**
	 * Returns specific data about a given event. If user credentials are provided, specific data on if they've saved or registered for the event will be provided (validated with getUserForApiCall).
	 *
	 * Parameters:
	 * <ul>
	 * <li>id - The full id of the event to search for</li>
	 * <li>source - The event vendor/source tied to the specific event (i.e. communico, springshare, or library_calendar)</li>
	 * </ul>
	 *
	 */

	/* @noinspection PhpUnused */
	function getEventDetails(): array {
		if (!isset($_REQUEST['id']) || !isset($_REQUEST['source'])) {
			return [
				'success' => false,
				'message' => 'Event id or source not provided'
			];
		}

		$source = $_REQUEST['source'];
		if($source == 'communico') {
			return $this->getCommunicoEventDetails();
		} else if ($source == 'library_calendar') {
			return $this->getLMEventDetails();
		} else if ($source == 'springshare') {
			return $this->getSpringshareEventDetails();
		} else {
			return [
				'success' => false,
				'message' => 'This event source is not supported.',
			];
		}
	}

	function getLMEventDetails(): array {
		require_once ROOT_DIR . '/RecordDrivers/LibraryCalendarEventRecordDriver.php';
		$libraryCalendarDriver = new LibraryCalendarEventRecordDriver($_REQUEST['id']);
		if($libraryCalendarDriver->isValid()) {
			$itemData['success'] = true;
			$itemData['id'] = $_REQUEST['id'];
			$itemData['title'] = $libraryCalendarDriver->getTitle();
			$itemData['isAllDay'] = (bool)$libraryCalendarDriver->isAllDayEvent();
			$itemData['startDate'] = $libraryCalendarDriver->getStartDate();
			$itemData['endDate'] = $libraryCalendarDriver->getEndDate();
			$itemData['description'] = strip_tags($libraryCalendarDriver->getDescription());
			$itemData['registrationRequired'] = $libraryCalendarDriver->isRegistrationRequired();
			$itemData['userIsRegistered'] = false;
			$itemData['inUserEvents'] = false;
			$itemData['registrationBody'] = strip_tags($libraryCalendarDriver->getRegistrationModalBody());
			$itemData['bypass'] = (bool)$libraryCalendarDriver->getBypassSetting();
			$itemData['cover'] = $libraryCalendarDriver->getEventCoverUrl();
			$itemData['url'] = $libraryCalendarDriver->getExternalUrl();
			$itemData['audiences'] = $libraryCalendarDriver->getAudiences();
			$itemData['categories'] = null;
			$itemData['programTypes'] = null;
			$itemData['room'] = null;

			// check if event has passed
			$today = new DateTime('now');
			$eventDay = $libraryCalendarDriver->getStartDate();
			$itemData['pastEvent'] = $today >= $eventDay;

			$itemData['location'] = $this->getDiscoveryBranchDetails($libraryCalendarDriver->getBranch());

			$user = $this->getUserForApiCall();
			if ($user && !($user instanceof AspenError)) {
				$itemData['userIsRegistered'] = $user->isRegistered($_REQUEST['id']);
				$itemData['inUserEvents'] = $user->inUserEvents($_REQUEST['id']);
			}

			return $itemData;
		}
		return [
			'success' => false,
			'message' => 'Event id not valid',
		];
	}

	function getCommunicoEventDetails(): array {
		require_once ROOT_DIR . '/RecordDrivers/CommunicoEventRecordDriver.php';
		$communicoDriver = new CommunicoEventRecordDriver($_REQUEST['id']);
		if($communicoDriver->isValid()) {
			$itemData['success'] = true;
			$itemData['id'] = $_REQUEST['id'];
			$itemData['title'] = $communicoDriver->getTitle();
			$itemData['isAllDay'] = (bool)$communicoDriver->isAllDayEvent();
			$itemData['startDate'] = $communicoDriver->getStartDate();
			$itemData['endDate'] = $communicoDriver->getEndDate();
			$itemData['description'] = strip_tags($communicoDriver->getDescription());
			$itemData['registrationRequired'] = $communicoDriver->isRegistrationRequired();
			$itemData['userIsRegistered'] = false;
			$itemData['inUserEvents'] = false;
			$itemData['registrationBody'] = strip_tags($communicoDriver->getRegistrationModalBody());
			$itemData['bypass'] = (bool)$communicoDriver->getBypassSetting();
			$itemData['cover'] = $communicoDriver->getEventCoverUrl();
			$itemData['url'] = $communicoDriver->getExternalUrl();
			$itemData['audiences'] = $communicoDriver->getAudiences();
			$itemData['categories'] = null;
			$itemData['programTypes'] = $communicoDriver->getProgramTypes();
			$itemData['room'] = $communicoDriver->getRoom();
			$itemData['location'] = $this->getDiscoveryBranchDetails($communicoDriver->getBranch());

			// check if event has passed
			$difference = $communicoDriver->getStartDate()->diff(new DateTime());;
			$difference = (int)$difference->format('%a');
			$itemData['pastEvent'] = $difference < 0;

			$user = $this->getUserForApiCall();
			if ($user && !($user instanceof AspenError)) {
				$itemData['userIsRegistered'] = $user->isRegistered($_REQUEST['id']);
				$itemData['inUserEvents'] = $user->inUserEvents($_REQUEST['id']);
			}

			return $itemData;
		}
		return [
			'success' => false,
			'message' => 'Event id not valid',
		];
	}

	function getSpringshareEventDetails(): array {
		require_once ROOT_DIR . '/RecordDrivers/SpringshareLibCalEventRecordDriver.php';
		$springshareDriver = new SpringshareLibCalEventRecordDriver($_REQUEST['id']);
		if($springshareDriver->isValid()) {
			$itemData['success'] = true;
			$itemData['id'] = $_REQUEST['id'];
			$itemData['title'] = $springshareDriver->getTitle();
			$itemData['isAllDay'] = (bool)$springshareDriver->isAllDayEvent();
			$itemData['startDate'] = $springshareDriver->getStartDate();
			$itemData['endDate'] = $springshareDriver->getEndDate();
			$itemData['description'] = strip_tags($springshareDriver->getDescription());
			$itemData['registrationRequired'] = $springshareDriver->isRegistrationRequired();
			$itemData['userIsRegistered'] = false;
			$itemData['inUserEvents'] = false;
			$itemData['registrationBody'] = strip_tags($springshareDriver->getRegistrationModalBody());
			$itemData['bypass'] = (bool)$springshareDriver->getBypassSetting();
			$itemData['cover'] = $springshareDriver->getEventCoverUrl();
			$itemData['url'] = $springshareDriver->getExternalUrl();
			$itemData['audiences'] = $springshareDriver->getAudiences();
			$itemData['categories'] = $springshareDriver->getCategories();
			$itemData['programTypes'] = null;
			$itemData['room'] = null;

			$itemData['location'] = $this->getDiscoveryBranchDetails($springshareDriver->getBranch());

			$user = $this->getUserForApiCall();
			if ($user && !($user instanceof AspenError)) {
				$itemData['userIsRegistered'] = $user->isRegistered($_REQUEST['id']);
				$itemData['inUserEvents'] = $user->inUserEvents($_REQUEST['id']);
			}

			return $itemData;
		}
		return [
			'success' => false,
			'message' => 'Event id not valid',
		];
	}

	function getDiscoveryBranchDetails($locationName = '') {
		if ($locationName) {
			$eventLocation = new Location();
			$eventLocation->displayName = $locationName;
			if($eventLocation->find(true)) {
				return [
					'name' => $eventLocation->displayName,
					'address' => $eventLocation->address,
					'phone' => $eventLocation->phone,
					'coordinates' => [
						'latitude' => $eventLocation->latitude,
						'longitude' => $eventLocation->longitude,
					]
				];
			}

			require_once ROOT_DIR . '/sys/Events/EventsBranchMapping.php';
			$locationMap = new EventsBranchMapping();
			$locationMap->eventsLocation = $locationName;
			if($locationMap->find(true)) {
				$eventLocation = new Location();
				$eventLocation->locationId = $locationMap->locationId;
				if($eventLocation->find(true)) {
					return [
						'name' => $eventLocation->displayName,
						'address' => $eventLocation->address,
						'phone' => $eventLocation->phone,
						'coordinates' => [
							'latitude' => $eventLocation->latitude,
							'longitude' => $eventLocation->longitude,
						]
					];
				}
			}
		}
		return [
			'name' => $locationName,
			'address' => '',
			'phone' => '',
			'coordinates' => [
				'latitude' => 0,
				'longitude' => 0,
			]
		];
	}

	/**
	 * Save an event for the user.
	 *
	 * Parameters:
	 * <ul>
	 * <li>id - The full id of the event to save</li>
	 * </ul>
	 *
	 */

	/* @noinspection PhpUnused */
	function saveEvent() {
		$user = $this->getUserForApiCall();
		if ($user && !($user instanceof AspenError)) {
			$id = $_REQUEST['id'];
			if (empty($id)) {
				return [
					'success' => false,
					'title' => translate(['text' => 'Error', 'isPublicFacing' => true]),
					'message' => 'You must provide an event id, source, and vendor to save this event.'
				];
			}
			
			require_once ROOT_DIR . '/sys/Events/UserEventsEntry.php';
			$userEventsEntry = new UserEventsEntry();
			$userEventsEntry->userId = $user->id;
			$userEventsEntry->sourceId = $id;

			$regRequired = false;
			$regModal = null;
			$externalUrl = null;
			if(str_starts_with($id, 'communico')) {
				require_once ROOT_DIR . '/RecordDrivers/CommunicoEventRecordDriver.php';
				$recordDriver = new CommunicoEventRecordDriver($id);
				if ($recordDriver->isValid()) {
					$title = $recordDriver->getTitle();
					$userEventsEntry->title = substr($title, 0, 50);
					$eventDate = $recordDriver->getStartDate();
					$userEventsEntry->eventDate = $eventDate->getTimestamp();
					if ($recordDriver->isRegistrationRequired()){
						$regRequired = true;
						$regModal = $recordDriver->getRegistrationModalBody();
					}
					$userEventsEntry->regRequired = $regRequired;
					$userEventsEntry->location = $recordDriver->getBranch();
					$externalUrl = $recordDriver->getExternalUrl();
				}
			} elseif(str_starts_with($id, 'libcal')) {
				require_once ROOT_DIR . '/RecordDrivers/SpringshareLibCalEventRecordDriver.php';
				$recordDriver = new SpringshareLibCalEventRecordDriver($id);
				if ($recordDriver->isValid()) {
					$title = $recordDriver->getTitle();
					$userEventsEntry->title = substr($title, 0, 50);
					$eventDate = $recordDriver->getStartDate();
					$userEventsEntry->eventDate = $eventDate->getTimestamp();
					if ($recordDriver->isRegistrationRequired()){
						$regRequired = true;
						$regModal = $recordDriver->getRegistrationModalBody();
					}
					$userEventsEntry->regRequired = $regRequired;
					$userEventsEntry->location = $recordDriver->getBranch();
					$externalUrl = $recordDriver->getExternalUrl();
				}
			} elseif(str_starts_with($id, 'lc')) {
				require_once ROOT_DIR . '/RecordDrivers/LibraryCalendarEventRecordDriver.php';
				$recordDriver = new LibraryCalendarEventRecordDriver($id);
				if ($recordDriver->isValid()) {
					$title = $recordDriver->getTitle();
					$userEventsEntry->title = substr($title, 0, 50);
					$eventDate = $recordDriver->getStartDate();
					$userEventsEntry->eventDate = $eventDate->getTimestamp();
					if ($recordDriver->isRegistrationRequired()){
						$regRequired = true;
						$regModal = $recordDriver->getRegistrationModalBody();
					}
					$userEventsEntry->regRequired = $regRequired;
					$userEventsEntry->location = $recordDriver->getBranch();
					$externalUrl = $recordDriver->getExternalUrl();
				}
			} else {
				return [
					'success' => false,
					'title' => translate(['text' => 'Error', 'isPublicFacing' => true]),
					'message' => 'Invalid source id',
				];
			}

			$userEventsEntry->dateAdded = time();

			if($userEventsEntry->find(true)) {
				$userEventsEntry->update();
			} else {
				$userEventsEntry->insert();
			}

			$message = translate(['text' => 'This event was saved to your events successfully.',
				'isPublicFacing' => true,]);

			if($regRequired) {
				$message = translate([
					'text' => 'This event was saved to your events successfully. Saving an event to your events is not the same as registering.',
					'isPublicFacing' => true,
				]);
			}

			return [
				'success' => true,
				'title' => translate([
					'text' => 'Added Successfully',
					'isPublicFacing' => true,
				]),
				'message' => $message,
				'registrationRequired' => $regRequired,
				'regBody' => $regModal,
				'url' => $externalUrl,
			];
		} else {
			return [
				'success' => false,
				'title' => translate(['text' => 'Error', 'isPublicFacing' => true]),
				'message' => 'Login unsuccessful',
			];
		}
	}

	/**
	 * Remove a previously saved event for the user.
	 *
	 * Parameters:
	 * <ul>
	 * <li>id - The full id of the event to search for</li>
	 * </ul>
	 *
	 */

	/* @noinspection PhpUnused */
	function removeSavedEvent() {
		$user = $this->getUserForApiCall();
		if ($user && !($user instanceof AspenError)) {
			if(isset($_REQUEST['id'])) {
				require_once ROOT_DIR . '/sys/Events/UserEventsEntry.php';
				$userEventsEntry = new UserEventsEntry();
				$userEventsEntry->sourceId = $_REQUEST['id'];
				if($userEventsEntry->find(true)) {
					$userEventsEntry->delete();
					return [
						'success' => true,
						'title' => translate(['text' => 'Success', 'isPublicFacing' => true]),
						'message' => translate([
							'text' => 'Event successfully removed from your events.',
							'isPublicFacing' => true
						])
					];
				} else {
					return [
						'success' => false,
						'title' => translate(['text' => 'Error', 'isPublicFacing' => true]),
						'message' => 'Sorry, we could not find that event in the system.',
					];
				}
			} else {
				return [
					'success' => false,
					'title' => translate(['text' => 'Error', 'isPublicFacing' => true]),
					'message' => 'You must provide a saved event id to remove it.',
				];
			}
		} else {
			return [
				'success' => false,
				'message' => 'Login unsuccessful',
			];
		}
	}

	/**
	 * Returns a list of events that a user has saved.
	 *
	 * Parameters:
	 * <ul>
	 * <li>filter - Filter to apply to the results (all, upcoming, past). Set to 'all' if not included.</li>
	 * <li>page - Used for pagination. Default is 1.</li>
	 * <li>pageSize - Used for pagination. Default is 20.</li>
	 * </ul>
	 *
	 */

	/* @noinspection PhpUnused */
	function getSavedEvents() {
		$curTime = time();
		global $configArray;
		$user = $this->getUserForApiCall();
		if ($user && !($user instanceof AspenError)) {
			$filter = $_REQUEST['filter'] ?? 'all';
			$page = $_REQUEST['page'] ?? 1;
			$pageSize = $_REQUEST['pageSize'] ?? 20;

			$savedEvents = [];
			$events = [];

			require_once ROOT_DIR . '/sys/Events/UserEventsEntry.php';
			$savedEvent = new UserEventsEntry();
			$savedEvent->userId = $user->id;

			if($filter == 'past') {
				$savedEvent->whereAdd("eventDate < $curTime");
				$savedEvent->orderBy('eventDate DESC');
			} elseif ($filter == 'upcoming') {
				$savedEvent->whereAdd("eventDate >= $curTime");
				$savedEvent->orderBy('eventDate ASC');
			} else {
				$savedEvent->orderBy('eventDate DESC');
			}
			$savedEvent->limit(($page - 1) * $pageSize, $pageSize);
			$savedEvent->find();

			while ($savedEvent->fetch()) {
				if (!array_key_exists($savedEvent->sourceId, $events)) {
					$savedEvents[$savedEvent->sourceId] = clone $savedEvent;
				}
			}

			foreach($savedEvents as $eventId => $event) {
				$_REQUEST['id'] = $eventId;
				$details = [];
				$source = 'unknown';
				$sourceFull = 'unknown';
				if(str_starts_with($eventId, 'lc')) {
					$source = 'lc';
					$sourceFull = 'library_calendar';
					$details = $this->getLMEventDetails();
				} else if(str_starts_with($eventId, 'communico')) {
					$source = 'communico';
					$sourceFull = 'communico';
					$details = $this->getCommunicoEventDetails();
				} else if(str_starts_with($eventId, 'libcal')) {
					$source = 'libcal';
					$sourceFull = 'springshare_libcal';
					$details = $this->getSpringshareEventDetails();
				} else {
					// something went wrong
				}

				if($details['success'] === true) {
					$events[$event->sourceId]['id'] = $event->id;
					$events[$event->sourceId]['sourceId'] = $event->sourceId;
					$events[$event->sourceId]['title'] = $event->title;
					$events[$event->sourceId]['startDate'] = $details['startDate'];
					$events[$event->sourceId]['endDate'] = $details['endDate'];
					$events[$event->sourceId]['url'] = $details['url'];
					$events[$event->sourceId]['bypass'] = $details['bypass'];
					$events[$event->sourceId]['cover'] = $configArray['Site']['url'] . '/bookcover.php?id=' . $event->sourceId . '&size=medium&type=' . $sourceFull . '_event';
					$events[$event->sourceId]['registrationRequired'] = $details['registrationRequired'];
					$events[$event->sourceId]['userIsRegistered'] = $details['userIsRegistered'];
					$events[$event->sourceId]['pastEvent'] = $details['pastEvent'];
					$events[$event->sourceId]['location'] = $details['location'];
					$events[$event->sourceId]['source'] = $source;
				} else {
					$events[$event->sourceId]['invalid'] = true;
					$events[$event->sourceId]['message'] = 'Event not found';
				}
			}

			$options = [
				'totalItems' => count($savedEvents),
				'perPage' => $pageSize,
				'append' => false,
			];

			$pager = new Pager($options);

			return [
				'success' => true,
				'totalResults' => $pager->getTotalItems(),
				'page_current' => (int)$pager->getCurrentPage(),
				'page_total' => (int)$pager->getTotalPages(),
				'filter' => $filter,
				'events' => $events,
			];
		} else {
			return [
				'success' => false,
				'message' => 'Login unsuccessful',
			];
		}
	}

	/**
	 * @return array
	 * @noinspection PhpUnused
	 */
	private function loadUsernameAndPassword() {
		$username = $_REQUEST['username'] ?? '';
		$password = $_REQUEST['password'] ?? '';

		if (isset($_POST['username']) && isset($_POST['password'])) {
			$username = $_POST['username'];
			$password = $_POST['password'];
		}

		if (is_array($username)) {
			$username = reset($username);
		}
		if (is_array($password)) {
			$password = reset($password);
		}
		return [$username, $password];
	}

	/**
	 * @return bool|User
	 */
	protected function getUserForApiCall() {
		$user = false;
		[$username, $password] = $this->loadUsernameAndPassword();
		$user = UserAccount::validateAccount($username, $password);
		if ($user !== false && $user->source == 'admin') {
			return false;
		}
		return $user;
	}

	function getBreadcrumbs(): array {
		return [];
	}
}