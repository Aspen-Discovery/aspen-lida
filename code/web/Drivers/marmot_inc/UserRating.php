<?php
/**
 * Table Definition for User Ratings
 */
require_once ROOT_DIR . '/sys/DB/DataObject.php';
class UserRating extends DataObject
{
  public $__table = 'user_rating';    // table name
  public $id;                       //int(11)
  public $userid;                   //int(11)
  public $resourceid;               //int(11)
  public $rating;                   //int(5)
	public $dateAdded;

	//Variables created with joins
	public $record_id;


  function keys() {
      return array('id', 'userid', 'resourceid');
  }
}