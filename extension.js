// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

let storytellerStatusBarItem = null;


function activate(context) {
	

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "spider" is now active!');
	updateStorytellerStatusBar('Whoops', 'THIS is a tool tip i think its just something that shows when you hover', 'spider.helloWorld');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('spider.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Spider!');

	});

	context.subscriptions.push(disposable);
}


/*
function handleTextEditorChange(event) {
    if(isStorytellerCurrentlyActive) {
        //path to the file that is being edited
        const filePath = event.document.fileName;

        //if the file being edited is in the tracked st project
        if(filePath.startsWith(vscode.workspace.workspaceFolders[0].uri.fsPath) === true) {
            //go through each of the changes in this change event (there can 
            //be more than one if there are multiple cursors)
            for(let i = 0;i < event.contentChanges.length;i++) {
                //get the change object
                const change = event.contentChanges[i];
    
                //if no text has been added, then this is a delete
                if(change.text.length === 0) {
                    //get some data about the delete
                    const numCharactersDeleted = change.rangeLength;
                    const deleteTextStartLine = change.range.start.line;
                    const deleteTextStartColumn = change.range.start.character;
        
                    //record the deletion of text
                    projectManager.handleDeletedText(filePath, deleteTextStartLine, deleteTextStartColumn, numCharactersDeleted);
                } else { //new text has been added in this change, this is an insert
                    //if there was some text that was selected and replaced 
                    //(deleted and then added)
                    if(change.rangeLength > 0) {
                        //get some data about the delete
                        const numCharactersDeleted = change.rangeLength;
                        const deleteTextStartLine = change.range.start.line;
                        const deleteTextStartColumn = change.range.start.character;

                        //first delete the selected code (insert of new text to follow)
                        projectManager.handleDeletedText(filePath, deleteTextStartLine, deleteTextStartColumn, numCharactersDeleted);
                    } 
        
                    //get some data about the insert
                    const newText = change.text;
                    const newTextStartLine = change.range.start.line;
                    const newTextStartColumn = change.range.start.character;
        
                    //a set of all the event ids from a copy/cut
                    let pastedInsertEventIds = [];

                    //if this was a paste
                    if(clipboardData.activePaste) { 
                        //if the new text is exactly the same as what was on our clipboard
                        if(newText === clipboardData.text) {
                            //store the pasted event ids
                            pastedInsertEventIds = clipboardData.eventIds;
                        } else { //this is a paste but it doesn't match the last storyteller copy/cut (pasted from another source)
                            //create an array of strings with 'other' for the paste event ids to signify a paste from outside the editor
                            pastedInsertEventIds = newText.split('').map(() => 'other');

                            //clear out any old data
                            clipboardData.text = '';
                            clipboardData.eventIds = [];
                        }

                        //we handled the most current paste, set this back to false
                        clipboardData.activePaste = false;
                    }
                    //record the insertion of new text
                    projectManager.handleInsertedText(filePath, newText, newTextStartLine, newTextStartColumn, pastedInsertEventIds);
                }
            }
        }
    }
}
	*/

function updateStorytellerStatusBar(text, tooltip, command) {
    //if the status bar has not been created yet
    if(storytellerStatusBarItem === null) {
        //add a storyteller item to the status bar
        storytellerStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);    
        storytellerStatusBarItem.text = text;
        storytellerStatusBarItem.tooltip = tooltip;
        storytellerStatusBarItem.command = command;
        storytellerStatusBarItem.show();
    } else { //the status bar has been created
        //update the existing status bar
        storytellerStatusBarItem.text = text;
        storytellerStatusBarItem.tooltip = tooltip;
        storytellerStatusBarItem.command = command;
    }
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
