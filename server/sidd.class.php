<?php
	class Sidd{
		/**
		 * url
		 *
		 * @var string
		 */
		private $url;
		
		/**
		 * __construct
		 *
		 * @param string $url of the zendesk site for which you want to save your json
		 * @author Stephen Rhyne
		 */
		
		
		/**
		 * data holds processed forum and entries data
		 *
		 * @var array
		 */
		private $data;
		
		
		public function __construct($url = "https://support.zendesk.com")
		{
			$this->url = $url;
		}
		
		
		public function get(){
			ob_start("ob_gzhandler");
			echo json_encode($this->_get());
			ob_end_flush();
			exit;
		}
		
		public function save($path = "sidd.json")
		{
			file_put_contents($path, json_encode($this->_get()));
			exit(json_encode(array(
				"status" => "OK", 
				"message" => "Zendesk data from $this->url saved to $path"
			)));
		}
		
		
		/**
		 * _get
		 *
		 * @return mixed array/object forums and entries
		 * @author Stephen Rhyne
		 */
		private function _get()
		{
			$forums = json_decode(file_get_contents($this->url."/forums.json"));
			
			$this->data = array(
				"forums" => array(),
				"entries" => array()
			);
			
			foreach ($forums as $forum) {
				$this->data['forums'][$forum->id] = $forum->name;
				$url = $this->url."/forums/".$forum->id."/entries.json";
				$entries = json_decode(file_get_contents($url));
				$this->processEntries($entries);
			}
			return $this->data;
		}
		
		/**
		 * processEntries
		 *
		 * Flattens each forum call into a single data['entries'] array, processes tags into real arrays
		 *
		 * @param array $entries 
		 * @return void
		 * @author Stephen Rhyne
		 */
		private function processEntries($entries = array())
		{
			foreach ($entries as $entry) {
				$entry->current_tags = explode(" ",$entry->current_tags);
				$this->data["entries"][]= $entry;
			}
		}	
	}
	
	
	
	
	
	