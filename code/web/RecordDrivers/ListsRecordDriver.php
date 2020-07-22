<?php
require_once ROOT_DIR . '/RecordDrivers/IndexRecordDriver.php';

class ListsRecordDriver extends IndexRecordDriver
{
	private $listObject;
	public function __construct($record)
	{
		// Call the parent's constructor...
		if (is_string($record)) {
			/** @var SearchObject_ListsSearcher $searchObject */
			$searchObject = SearchObjectFactory::initSearchObject('Lists');
			$fields = $searchObject->getRecord($record);
			parent::__construct($fields);
		}else {
			parent::__construct($record);
		}
	}

	public function isValid(){
		return true;
	}

	function getBookcoverUrl($size = 'small', $absolutePath = false)
	{
		global $configArray;
		if ($absolutePath) {
			$bookCoverUrl = $configArray['Site']['url'];
		} else {
			$bookCoverUrl = '';
		}
		$id = $this->getId();
		$bookCoverUrl = $bookCoverUrl . "/bookcover.php?type=list&amp;id={$id}&amp;size={$size}";
		return $bookCoverUrl;
	}

	/**
	 * Assign necessary Smarty variables and return a template name to
	 * load in order to display a summary of the item suitable for use in
	 * search results.
	 *
	 * @access  public
	 * @return  string              Name of Smarty template file to display.
	 */
	public function getSearchResult($view = 'list', $showListsAppearingOn = true){
		if ($view == 'covers') { // Displaying Results as bookcover tiles
			return $this->getBrowseResult();
		}

		global $interface;

		$id = $this->getUniqueID();
		$interface->assign('summId', $id);
		$interface->assign('bookCoverUrl', $this->getBookcoverUrl('medium'));
		$interface->assign('summShortId', $id);
		$interface->assign('summTitle', $this->getTitle(true));
		$interface->assign('summAuthor', $this->getPrimaryAuthor());
		if (isset($this->fields['description'])){
			$interface->assign('summDescription', $this->getDescription());
		}else{
			$interface->assign('summDescription', '');
		}
		if (isset($this->fields['num_titles'])){
			$interface->assign('summNumTitles', $this->fields['num_titles']);
		}else{
			$interface->assign('summNumTitles', 0);
		}
		$interface->assign('summDateUpdated', $this->getListObject()->dateUpdated);

		if ($showListsAppearingOn) {
			//Check to see if there are lists the record is on
			require_once ROOT_DIR . '/sys/LocalEnrichment/UserList.php';
			$appearsOnLists = UserList::getUserListsForRecord('Lists', $this->getId());
			$interface->assign('appearsOnLists', $appearsOnLists);
		}

		// Obtain and assign snippet (highlighting) information:
		$snippets = $this->getHighlightedSnippets();
		$interface->assign('summSnippets', $snippets);

		return 'RecordDrivers/List/result.tpl';
	}

	public function getMoreDetailsOptions(){
		return array();
	}

	// initially taken From GroupedWorkDriver.php getBrowseResult();
	public function getBrowseResult(){
		global $interface;
		$id = $this->getUniqueID();
		$interface->assign('summId', $id);

		$url ='/MyAccount/MyList/'.$id;

		$interface->assign('summUrl', $url);
		$interface->assign('summTitle', $this->getTitle());
		$interface->assign('summAuthor', $this->getPrimaryAuthor());

		$interface->assign('bookCoverUrl', $this->getBookcoverUrl('small'));
		$interface->assign('bookCoverUrlMedium', $this->getBookcoverUrl('medium'));

		return 'RecordDrivers/List/cover_result.tpl';
	}

	function getFormat() {
		// overwrites class IndexRecordDriver getFormat() so that getBookCoverURL() call will work without warning notices
		return array('List');
	}

	/**
	 * Get the full title of the record.
	 *
	 * @return  string
	 */
	public function getTitle($useHighlighting = false) {
		// Don't check for highlighted values if highlighting is disabled:
		if ($this->highlight && $useHighlighting) {
			if (isset($this->fields['_highlighting']['title_display'][0])){
				return $this->fields['_highlighting']['title_display'][0];
			}
		}

		if (isset($this->fields['title_display'])){
			return $this->fields['title_display'];
		}
		return '';
	}

	function getDescriptionFast($useHighlighting = false) {

		// Don't check for highlighted values if highlighting is disabled:
		if ($this->highlight && $useHighlighting) {
			if (isset($this->fields['_highlighting']['description'][0])) {
				return $this->fields['_highlighting']['description'][0];
			}
		}
		return $this->fields['description'];
	}

	function getMoreInfoLinkUrl() {
		return $this->getLinkUrl();
	}

	/**
	 * Assign necessary Smarty variables and return a template name to
	 * load in order to display a summary of the item suitable for use in
	 * user's favorites list.
	 *
	 * @access  public
	 * @param int $listId ID of list containing desired tags/notes (or
	 *                              null to show tags/notes from all user's lists).
	 * @param bool $allowEdit Should we display edit controls?
	 * @return  string              Name of Smarty template file to display.
	 */
	public function getListEntry($listId = null, $allowEdit = true)
	{
		//Use getSearchResult to do the bulk of the assignments
		$this->getSearchResult('list', false);

		//Switch template
		return 'RecordDrivers/List/listEntry.tpl';
	}

	public function getModule()
	{
		return 'MyAccount/MyList';
	}

	/**
	 * Assign necessary Smarty variables and return a template name to
	 * load in order to display the full record information on the Staff
	 * View tab of the record view page.
	 *
	 * @access  public
	 * @return  string              Name of Smarty template file to display.
	 */
	public function getStaffView()
	{
		return null;
	}

	public function getDescription()
	{
		return $this->fields['description'];
	}

	private function getListObject()
	{
		if ($this->listObject == null){
			require_once ROOT_DIR . '/sys/LocalEnrichment/UserList.php';
			$this->listObject = new UserList();
			$this->listObject->id = $this->getId();
			if (!$this->listObject->find(true)){
				$this->listObject = false;
			}
		}
		return $this->listObject;
	}


}