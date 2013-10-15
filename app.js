(function(window){
	var doc = window.document,
			$ = function(selector){
				var result = doc.querySelectorAll(selector);
				return (result.length > 1) ? result : result[0];
			};

	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

	if(window.requestFileSystem){
		// create a variable that stores a reference to the filesystem
		var filesystem = null;

		// get references to the page elements
		var form = $('#file-form'),
				filenameInput = $('#filename'),
				contentTextArea = $('#contentTextArea'),
				fileList = $('#file-list'),
				messageBox = $('#messages'),
				errorBox = $('#error');

		// A simple error handler to be used throughout this demo.
		function errorHandler(error) {
		  var message = '';

		  switch (error.code) {
		    case FileError.SECURITY_ERR:
		      message = 'Security Error';
		      break;
		    case FileError.NOT_FOUND_ERR:
		      message = 'Not Found Error';
		      break;
		    case FileError.QUOTA_EXCEEDED_ERR:
		      message = 'Quota Exceeded Error';
		      break;
		    case FileError.INVALID_MODIFICATION_ERR:
		      message = 'Invalid Modification Error';
		      break;
		    case FileError.INVALID_STATE_ERR:
		      message = 'Invalid State Error';
		      break;
		    default:
		      message = 'Unknown Error';
		      break;
		  }

		  errorBox.innerHTML = message;
		}

		// Request a filesystem and set the filesystem variable
		function initFileSystem(){
			navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 5, function(grantedSize) {
				// request a filesystem with the new size
				window.requestFileSystem(window.PERSISTENT, grantedSize, function(fs) {
					// set the filesystem variable
					filesystem = fs;
					// set up the event listeners on the form
					setupFormEventListener();
					// list all the files
					listFiles();
				}, errorHandler);
			}, errorHandler);
		}

		initFileSystem();

		function setupFormEventListener() {
			form.addEventListener('submit', function(e) {
				e.preventDefault();

				// get the form data
				var filename = filenameInput.value,
						content = contentTextArea.value;

				// save the file;
				console.log(filename, content);
				saveFile(filename, content);

			}, false);
		}

		// save a file in the filesystem
		function saveFile(filename, content) {
			filesystem.root.getFile(filename, { create: true }, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = function(e) {
						// update the file browser
						listFiles();

						// clean out the form field
						filenameInput.value = '';
						contentTextArea.value = '';

						// show a saved message
						messageBox.innerHTML = 'File Saved';
					};

					fileWriter.onerror = function(e) {
						errorBox.innerHTML = 'Write error: ' + e.toString();
					};

					// create a blob and write it
					console.log(content);
					var contentBlob = new Blob([content], {type: 'text/plain'});
					fileWriter.write(contentBlob);

				}, errorHandler);
			}, errorHandler);
		}

		function listFiles() {
			var dirReader = filesystem.root.createReader();
			var entries = [];

			var fetchEntries = function() {
				dirReader.readEntries(function(results) {
					if(!results.length) {
						displayEntries(entries.sort().reverse());
					} else {
						entries = entries.concat([].slice.call(results));
						fetchEntries();
					}
				}, errorHandler);
			};

			fetchEntries();
		}

		function displayEntries(entries) {
			// clear out the current filelist
			fileList.innerHTML = '';

			entries.forEach(function(entry, i) {
				// create an li element
				var li = doc.createElement('li');

				// create a read link for the file
				var link = doc.createElement('a');
				link.innerHTML = entry.name;
				link.classList.add('edit-file');
				li.appendChild(link);

				// create a delete link for the file
				var delLink = doc.createElement('a');
				delLink.innerHTML = 'x';
				delLink.classList.add('delete-file');
				delLink.classList.add('floatR');
				li.appendChild(delLink);

				// add this li to the fileList
				fileList.appendChild(li);

				// set up an event listener that loads the file when clicked
				link.addEventListener('click', function(e) {
					e.preventDefault();
					loadFile(entry.name);
				}, false);

				// set up a delete event listener that deletes the file when delete click is clicked
				delLink.addEventListener('click', function(e) {
					e.preventDefault();
					deleteFile(entry.name);
				}, false);
			});
		}

		function loadFile(filename) {
			filesystem.root.getFile(filename, {}, function(fileEntry) {
				fileEntry.file(function(file) {
					var reader = new FileReader();

					reader.onload = function(e) {
						// update the form fields
						filenameInput.value = filename;
						contentTextArea.value = e.target.result;

						messageBox.innerHTML = filename + ' loaded';
					};

					reader.readAsText(file);
				}, errorHandler);
			}, errorHandler);
		}

		function deleteFile(filename) {
			filesystem.root.getFile(filename, {create: false}, function(fileEntry) {
				fileEntry.remove(function(e) {
					// update the file browser
					listFiles();

					// show the deleted message
					messageBox.innerHTML = 'File Deleted';
				}, errorHandler);
			}, errorHandler);
		}

	} else {
		console.log('FileSystem API is not supported in your browser');
	}

}(this));