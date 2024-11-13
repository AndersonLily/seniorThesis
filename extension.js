// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const fs2 = require('fs').promises;

const BUG_TYPE = {
    FUNCTIONAL: 0,
    PREPROCESSOR: 1,
    SYNTAX: 2,
    MOD: 3
};

const tokenTypes = ['asm', 'double', 'new',	'switch', 'auto', 'else',
    'operator',	'template', 'break', 'enum', 'private',	'this', 'case',
    'extern','protected', 'throw', 'catch',	'float', 'public', 'try',
    'char',	'for',	'register',	'typedef',
    'class',	'friend', 'return',	'union',
    'const', 'goto',	'short',	'unsigned',
    'continue',	'if',	'signed',	'virtual',
    'default',	'inline',	'sizeof',	'void',
    'delete' ,'int',	'static',	'volatile', 
    'do',	'long',	'struct',	'while' ];

const includesInC = ['<algorithm>',	'<iomanip>', '<list>', '<ostream>',
	'<streambuf>', '<bitset>', '<ios>',	'<locale>',	'<queue>',	'<string>',
    '<complex>', '<iosfwd>','<map>','<set>', '<typeinfo>', '<deque>', '<iostream>',
    '<memory>',	'<sstream>','<utility>', '<exception>',	'<istream>','<new>','<stack>',
    '<valarray>,', '<fstream>',	'<iterator>', '<numeric>',	'<stdexcept>',	'<vector>',
    '<functional>',	'<limits>',	'<array>', '<condition_variable>', '<mutex>', '<scoped_allocator>',
    '<type_traits>', '<atomic>','<forward_list>','<random>', '<system_error>',	'<typeindex>',
    '<chrono>',	'<future>',	'<ratio>',	'<thread>',	'<unordered_map>', '<codecvt>',	'<initializer_list>',
    '<regex>', '<tuple>', '<unordered_set>', '<shared_mutex>', '<any>',	'<execution>',	'<memory_resource>',
    '<string_view>', '<variant>', '<charconv>',	'<filesystem>',	'<optional>', '<barrier>',	'<concepts>',
    '<latch>', '<semaphore>', '<stop_token>', '<bit>', '<coroutine>', '<numbers>', '<source_location>',	
    '<syncstream>', '<compare>','<format>',	'<ranges>',	'<span>', '<version>', '<expected>','<flat_set>',
    '<mdspan>',	'<spanstream>',	'<stdfloat>', '<flat_map>',	'<generator>', '<print>','<stacktrace>',
    '<debugging>',	'<inplace_vector>',	'<linalg>',	'<rcu>','<text_encoding>','<hazard_pointer>',
    '<cassert>', '<clocale>', '<cstdarg>','<cstring>','<cctype>','<cmath>',	'<cstddef>','<ctime>',
    '<cerrno>',	'<csetjmp>',	'<cstdio>',	'<cwchar>','<cfloat>',	'<csignal>',	'<cstdlib>',
    '<cwctype>', '<climits>'];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */


let filesToModify = [];
let current_directory = null;
let spiderFileSelectStatusBarItem = null;
let secondFileStatusBarItem = null;

/* Since in the package.json has the activationEvents that contains
 * "onStartUpFinished" this function will run then, that is why all of the
 * commands included are registered here as well as calling the startup_command.
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
    context.subscriptions.push(vscode.commands.registerCommand('spider.startup', startup_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.collectFiles', collectFiles_command));
	context.subscriptions.push(vscode.commands.registerCommand('spider.helloWorld', hello_world_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.createDirectory', create_directory_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.openPreviousDirectory', open_previous_directory_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.ReadandBugFiles', bug_files_command));
  //  context.subscriptions.push(vscode.commands.registerCommand('spider.createDirectory', // function :)));

    
   vscode.commands.executeCommand('spider.startup');
}

function startup_command(){
    console.log('startup_command');

    let new_directory = 'Create a new Spider directory'
    let old_directory = 'Open a old Spider directory'

    vscode.window.showInformationMessage('What do you want to do today?', new_directory, old_directory).then(selection => {
        if (selection === new_directory) {
            // TO DO: add icon to this from the vscode style guidelines either this is a bug to "bug" for a file to show the collection needs to happen
                    updateSpiderStatusBar('Spider - Add files', 'Select files that you want to search for bugs in', 'spider.collectFiles');
            }
        else if (selection === old_directory){
            updateSpiderStatusBar('Spider - Open Directory', 'Select the directory that contains the files you want to search for bugs in', 'spider.openPreviousDirectory');
         }
        }); //tee hee
}

function collectFiles_command(){
    console.log('collectFiles_command');
    // According to the vscode api on linux and windows a open dialog cannot
    // be both file selector and folder selecter, since I am prompting the user for
    // a file only that can select is set to true.
    let options = vscode.OpenDialogOptions ={
       canSelectFiles: true
    }
    vscode.window.showOpenDialog(options).then(value => {
        if (value == undefined){
            console.log("Issue with opening a file selector");
            // Have a "THROW" for this issue Maybe?
        }else{
            //filtering out anything that isn't a .h .cpp or .c
            let startOfType = (value.at(0).path).lastIndexOf('.')
            let fileType = value.at(0).path.slice(startOfType, value.at(0).path.length)

            if(fileType === ".c" || fileType === ".cpp" || fileType === ".h"){
            filesToModify.push(value.at(0))
            get_new_folder_name()
            updateSecondStatusBar('Create directory now', 'When you have collected all the files you want to bug select this button to collect them into the same directory', 'spider.createDirectory', true);
            }
        }
    });
  
}

//If this is called then the current directory will be set to what is generated.
function get_new_folder_name(){
// Have this folder title be Spider (date genrated) files inside
// get the path to the current direcory and generate the name :)

const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth() + 1; 
const  dd = today.getDate();

const formattedToday = dd + '-' + mm + '-' + yyyy;  //'-'

// TODO: the fs.path needs to be altered to not have double slashes :)
current_directory = vscode.workspace.workspaceFolders[0].uri.fsPath + "/" + "Spider-" + formattedToday;
}


async function create_directory_command() {

    dirPath = current_directory

    let extra_slash = (current_directory).indexOf('C:')

    if(extra_slash != 0 && extra_slash != -1){
        current_directory = current_directory.slice(extra_slash, current_directory.length)
    }

    if (dirPath != null){
    try {
        await fs2.mkdir(dirPath, {recursive: true });

        for(let count_of_files = 0; count_of_files < filesToModify.length; count_of_files++){
           // By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
            try {
                const file_name = (filesToModify[count_of_files].fsPath).split('\\').pop().split('/').pop();
                let individual_Path = dirPath + "\\" + file_name;
            
                await fs2.copyFile(filesToModify[count_of_files].fsPath, individual_Path);
                //console.log('source.txt was copied to destination.txt');
                updateSecondStatusBar('Create directory now', 'When you have collected all the files you want to bug select this button to collect them into the same directory', 'spider.createDirectory', false);
            }catch {
                console.error('The file could not be copied');
            }
        } 

        console.log('Directory created');
    } catch (err) {
        console.error('An error occurred:', err);
    }}
    else {
        console.log('ERROR: Tried to create a folder with a null path')
    }
}

function open_previous_directory_command(){
    let options = vscode.OpenDialogOptions = {
        canSelectFolders: true
    }

     vscode.window.showOpenDialog(options).then(value => {
         if (value == undefined){
             console.log("Problem in open previous directory command");
             // Have a "THROW" for this issue 
         }else{
             //filtering out anything that isn't a .h .cpp or .c
             
             let findSpider = (value.at(0).path).indexOf('Spider-')
             //let specificSpiderDi = value.at(0).path.slice(startOfType, value.at(0).path.length)

             if(findSpider != -1){
                current_directory = value.at(0).path
                let extra_slash = (current_directory).indexOf('C:')

                if(extra_slash != 0 && extra_slash != -1){
                    current_directory = current_directory.slice(extra_slash, current_directory.length)
                }
             }
         }
     });
}

 function get_files_from_spider_directory(dir){

    for(let remove_counter = filesToModify.length ; remove_counter >= 0; remove_counter--){
        filesToModify.pop();
        console.log("removed the last thing in filestomodify")
    }

    let newFile;
    //try {
        const files = fs.readdirSync(dir);
        for (const file of files){
          newFile = dir + "/" + file
          filesToModify.push(newFile.toString());
        }
}


function getCodeLength(data_string){
    let codeCounter = 0;
    let inSingleComment = false;
    let inMultiComment = false;
    let possibleToBeinComment = true;

    for(let i = 0; i < data_string.length; i++){
        if(possibleToBeinComment){
            if(i != 0 && data_string.at(i) === '/' && data_string.at(i-1) === '/' && !inMultiComment){
                inSingleComment = true;
            }
            else if(i != 0 && data_string.at(i) === '*' && data_string.at(i-1) === '/' && !inSingleComment){
                inMultiComment = true;
            }
            else if(i != 0 && data_string.at(i) === '/' && data_string.at(i-1) === '*' && inMultiComment){
                inMultiComment = false;
            }
            else if(i != 0 && data_string.at(i) === '\n' && inSingleComment){
                inSingleComment = false;
            }
            else if(i != 0 && data_string.at(i) === '\"'){
                possibleToBeinComment = false;
                codeCounter++;
            }
            else if(!inSingleComment && !inMultiComment){
                codeCounter++;
            }
        }
        else{
            if(data_string.at(i) === '\"'){
                possibleToBeinComment = true;
            }
            codeCounter++;
        }
    }
    return codeCounter;
}


function getAllVariableTypes(data_string){
     // Find all the variables, gather their names and change the spelling in one use of the program
     let just_variable_vector = ['double', 'float', 'char',	'short', 'int'];

     let lastIndex = 0;
     let tempString = data_string;

     // Finding all the included .h files ie string, vector or user created classes
    while(tempString.indexOf(".h", lastIndex) != -1 ){

     let next_space = data_string.indexOf("\r\n", tempString.indexOf(".h", lastIndex))
          // Go backwards to get the full name of the included class
         for(let i = tempString.indexOf(".h", lastIndex); i > 0; i--){
             if(tempString.at(i) == "\""){
                 just_variable_vector.push(tempString.substr(i + 1, ((tempString.indexOf(".h", lastIndex) - 1) - i)));
                 break;
             }
         }
         lastIndex = next_space;
     }

     //NOW get all of the variables names
     let variable_names = [];
     for(let counter = 0; counter < just_variable_vector.length; counter++){
          // reset for next loop
         lastIndex = 0;
         while(tempString.indexOf(just_variable_vector.at(counter), lastIndex) != -1 ){

             let declaration = tempString.indexOf(just_variable_vector.at(counter), lastIndex);

             let next_space = 0;
                  // Go forwards to get where the first = , ; ) is 
                 for(let i = declaration; i < tempString.length; i++){
                     if(tempString.at(i) == "(" ||tempString.at(i) == "{" || tempString.at(i) == ":" || tempString.at(i) == "\r\n" || tempString.at(i) == "\'" || tempString.at(i) == "."){
                         next_space = i;
                         break;
                        }

                     if(tempString.at(i) == ";" || tempString.at(i) == "=" || tempString.at(i) == "," || tempString.at(i) == ")" ){
                         next_space = i;
                         let space = tempString.substr(declaration, i - declaration);
                         space = space.substr(space.indexOf(" ") + 1, space.length);
                         variable_names.push(space);
                         break;
                        }
                    }
                lastIndex = next_space;
            }  
        }

    return variable_names
}

function functional_bug(data_string, path){
// change the data stirng 
let successful = false;
let return_string = data_string;

let what_switch = (Math.floor(Math.random()* 13));
switch(what_switch){
    case 0:
        break;
    case 1:
        break;
    case 2:
        break;
    case 3:
        break;
    case 4:
        break;
    case 5:
        break;
    case 6:
        break;
    case 7:
        break;
    case 8:
        break;
    case 9:
        break;
    case 10:
        break;
    case 11:
        break;
    case 12:
        break;
    default:
        

}


if(data_string != return_string){
    successful = true;
} 



return{
    didBug: successful,
    bugstring: return_string
}
}

function preprocesser_bug(data_string, path){
let successful = false;
let return_string = data_string;

const doRemove = ((Math.floor(Math.random()* 2))%2 == 0);
if (doRemove){
// Removing a preprocessor command
    let definesPresent = [];

    // Finding the location of all the preprocessor commands
    for(let counter = 0; counter < data_string.length; counter++){
        // If the # is present put it into the define_present
        if(data_string.at(counter) == '#'){
            definesPresent.push(counter);
        }
    }

    if(definesPresent.length != 0){
        // Grab the string to remove from the string of all the text in the .cpp or .h file
        let toRemove = (Math.floor(Math.random()* definesPresent.length));
        let nextSpace = data_string.indexOf( "\r\n", definesPresent.at(toRemove));
        let substring = data_string.substr(definesPresent.at(toRemove), (nextSpace - definesPresent.at(toRemove)));

        return_string = data_string.replace(substring, "");

        if(return_string.search(substring) == -1){
            successful = true;
        }   
    }
}else 
{
    return_string = data_string;
    // This will be randomized 8 is chosen because there are 8 cases (seven and 1 default).
    const whichCase = (Math.floor(Math.random()* 8));
    switch(whichCase) {
        case 0:
            //Insert a random C++ standard libary include
            const what_include_to_add = includesInC.at((Math.floor(Math.random()* includesInC.length)));
            //This extention is currently written for a windows machine, having it only add
            // \n potentially could mean that the extetnion won't removed it if the remove bug is chosen
            // next because it only removed when it finds a \r\n, more testing would be nessesary to 
            // catch this edge case.
            return_string = "#include " + what_include_to_add + "\n" + return_string;
            break;
        case 1:
          //Insert a random mispelled C++ standard libary include
          //Learned that javascript strings are immutiable 
          let what_include_to_scramble = includesInC.at((Math.floor(Math.random()* includesInC.length)));

          for(let counter = 0; counter < what_include_to_scramble.length - 1; counter++){
            
            if(what_include_to_scramble.length % counter == 0 && counter > 0){
               // Steps are seperated for readablility
               let temp = what_include_to_scramble.substring(0, counter);
               temp = temp + what_include_to_scramble.at(counter + 1);
               temp = temp + what_include_to_scramble.at(counter) 
               temp = temp + what_include_to_scramble.substring(counter + 2, what_include_to_scramble.length);
               what_include_to_scramble = temp;
            }
          }
            //This extention is currently written for a windows machine, having it only add
            // \n potentially could mean that the extetnion won't removed it if the remove bug is chosen
            // next because it only removed when it finds a \r\n, more testing would be nessesary to 
            // catch this edge case.
            return_string = "#include " + what_include_to_scramble + "\n" + return_string;
          break;
        case 2:
          //Insert a random define statment that undefines a token
          const what_token_to_undefine = tokenTypes.at((Math.floor(Math.random()* tokenTypes.length)));
          return_string = "#undef " + what_token_to_undefine + "\n" + return_string;
          break;
        case 3:
            //Insert a define statment that changes the value of a token to another token
            const token1 = tokenTypes.at((Math.floor(Math.random()* tokenTypes.length)));
            const token2 = tokenTypes.at((Math.floor(Math.random()* tokenTypes.length)));
            return_string = "#define " + token1 + " " + token2+ "\n" + return_string;
          break;
        case 4:
          //Insert a define statment that changes the value of a token to number
          const what_token_to_change_def = tokenTypes.at((Math.floor(Math.random()* tokenTypes.length)));
          return_string = "#define " + what_token_to_change_def + " " + (Math.floor(Math.random()* 1000)) +"\n" + return_string;
          break;
        case 5:
          //ADD impossible and #if #endif
          const where_to_insert_endif = (Math.floor(Math.random()* data_string.length));
          let temp2 = "#if 0\n" + data_string.substring(0, where_to_insert_endif);
          temp2 = temp2 + "\n#endif\n" + data_string.substring(where_to_insert_endif, data_string.length);
          return_string = temp2;
          break;
        case 6:
          //ADD only #include
          return_string = "#include \n" + return_string;
          break;
        case 7:
          //ADD only # endif
          const where_to_insert__only_endif = (Math.floor(Math.random()* data_string.length));
          let temp3 = data_string.substring(0, where_to_insert__only_endif);
          temp3 = temp3 + "\n#endif\n" + data_string.substring(where_to_insert__only_endif, data_string.length);
          return_string = temp3;
            break;
        default:
          //Redefine NULL :)
          return_string = "#define NULL = 1\n" + return_string;
      }
    if(data_string.localeCompare(return_string) != 0){
        successful = true;
    } 
}

return{
    didBug: successful,
    bugstring: return_string
}
}

function syntax_bug(data_string, path){
    let successful = false;
    let return_string = data_string;


    const doRemove = ((Math.floor(Math.random()* 2))%2 == 0);
    if (doRemove){
        // This will remove something in the code that causes a syntax error

        const what_switch = (Math.floor(Math.random()* 3));

     switch(what_switch) {
        case 0:
            //This will delete a single parenthesis to unbalance them
            let parenthesisPresent = [];
            // Finding the location of all the parenthesis 
            for(let counter = 0; counter < data_string.length; counter++){
                // If the # is present put it into the define_present
                if(data_string.at(counter) == '(' || data_string.at(counter) == ')'){
                    parenthesisPresent.push(counter);
                }
            }

            if(parenthesisPresent.length != 0){
                // Grab the string to remove from the string of all the text in the .cpp or .h file
                let toRemove = (Math.floor(Math.random()* parenthesisPresent.length));
                let temp = data_string.substr(0, parenthesisPresent.at(toRemove));
                return_string = temp + data_string.substr(parenthesisPresent.at(toRemove) + 1, data_string.length);
    
                if(data_string != return_string){
                    successful = true;
                }   
            }
           
            break;
        case 1:
            // This will remove a semicolon
            let semiPresent = [];
            // Finding the location of all the semicolons 
            for(let counter = 0; counter < data_string.length; counter++){
                // If the ; is present put it into the define_present
                if(data_string.at(counter) == ';'){
                    semiPresent.push(counter);
                }
            }

            if(semiPresent.length != 0){
                // Grab the string to remove from the string of all the text in the .cpp or .h file
                let toRemove = (Math.floor(Math.random()* semiPresent.length));
                return_string = data_string.substr(0, semiPresent.at(toRemove));
                return_string = return_string + data_string.substr(semiPresent.at(toRemove) + 1, data_string.length);
    
                if(data_string != return_string){
                    successful = true;
                }   
            }
            break;

        case 2:
            // This will remove the start or ending qoutes for any strings 
            let qoutePresent = [];
            // Finding the location of all the qoutes
            for(let counter = 0; counter < data_string.length; counter++){
                // If the " is present put it into the define_present
                if(data_string.at(counter) == '\"'){
                    qoutePresent.push(counter);
                }
            }

            if(qoutePresent.length != 0){
                // Grab the string to remove from the string of all the text in the .cpp or .h file
                let toRemove = (Math.floor(Math.random()* qoutePresent.length));
                return_string = data_string.substr(0, qoutePresent.at(toRemove));
                return_string = return_string + data_string.substr(qoutePresent.at(toRemove) + 1, data_string.length);
    
                if(data_string != return_string){
                    successful = true;
                }   
            }

         break;

        default:

        let returnPresent = [];

        let tempString = data_string;
        let lastIndex = 0;
        // Finding the location of all the preprocessor commands
        while(tempString.indexOf("return", lastIndex) != -1 ){
                let looking_str = "return"
                returnPresent.push(tempString.indexOf(looking_str, lastIndex));
                lastIndex = tempString.indexOf(looking_str, lastIndex) + looking_str.length
        }

        if(returnPresent.length != 0){
            // Grab the string to remove from the string of all the text in the .cpp or .h file
            let toRemove = (Math.floor(Math.random()* returnPresent.length));
            let nextSpace = data_string.indexOf( "\r\n", returnPresent.at(toRemove));
            let substring = data_string.substr(returnPresent.at(toRemove), (nextSpace - returnPresent.at(toRemove)));
    
            return_string = data_string.replace(substring, "");
    
            if(return_string.search(substring) == -1){
                successful = true;
            }   
        }
    }
}
else{
    // This add something in the code that causes a syntax error or change existing code

    // Purposely a larger number so the defualt case is more likely.
    const what_switch = (Math.floor(Math.random()* 6));
    switch(what_switch) {
        case 0:
            //This will add a parenthesis next to an existing parenthesis.
            let parenthesisPresent = [];
            // Finding the location of all the parenthesis 
            for(let counter = 0; counter < data_string.length; counter++){
                // If the # is present put it into the define_present
                if(data_string.at(counter) == '(' || data_string.at(counter) == ')'){
                    parenthesisPresent.push(counter);
                }
            }

            if(parenthesisPresent.length != 0){
                //This will add the same type of parenthesis (open matches open, close matches close as if there was a double click)
                let toAddNextToo = (Math.floor(Math.random()* parenthesisPresent.length));
                let temp = data_string.substr(0, parenthesisPresent.at(toAddNextToo)+ 1) + data_string.at(parenthesisPresent.at(toAddNextToo));
                return_string = temp + data_string.substr(parenthesisPresent.at(toAddNextToo) + 1, data_string.length);
    
                if(data_string != return_string){
                    successful = true;
                }   
            }
            break;

        case 1:
            // This will insert a semi colon in hte middle of any line.
            const where_to_insert_semi = (Math.floor(Math.random()* data_string.length));
            let temp = data_string.substring(0, where_to_insert_semi);
            temp = temp + ";" + data_string.substring(where_to_insert_semi, data_string.length);
            return_string = temp;
            break;
        case 2:
            // This will add a qoute next to any existing qoute.
            let qoutePresent = [];
            // Finding the location of all the qoutes 
            for(let counter = 0; counter < data_string.length; counter++){
                if(data_string.at(counter) == "\""){
                    qoutePresent.push(counter);
                }
            }

            if(qoutePresent.length != 0){
                let toAddNextToo = (Math.floor(Math.random()* qoutePresent.length));
                let temp = data_string.substr(0, qoutePresent.at(toAddNextToo)+ 1) + data_string.at(qoutePresent.at(toAddNextToo));
                return_string = temp + data_string.substr(qoutePresent.at(toAddNextToo) + 1, data_string.length);
    
                if(data_string != return_string){
                    successful = true;
                }   
            }
            break;

        case 3:
            // TODO: HAVE THE RETRUN HAVE THE SAME INDENTATION 
            // This will as a return statment right before a closing brace.
            let endBracePresent = [];
            // Finding the location of all the qoutes 
            for(let counter = 0; counter < data_string.length; counter++){
                if(data_string.at(counter) == "}"){
                    endBracePresent.push(counter);
                }
            }

            if(endBracePresent.length != 0){
                let toAddNextToo = (Math.floor(Math.random()* endBracePresent.length));
                let temp = data_string.substr(0, endBracePresent.at(toAddNextToo)) + "return 0; \n";
                return_string = temp + data_string.substr(endBracePresent.at(toAddNextToo), data_string.length);
    
                if(data_string != return_string){
                    successful = true;
                }   
            }

            break;

        default:
        // Change the spelling of a instance of a variable 
        let variable_names = getAllVariableTypes(data_string);

        if (variable_names.length != 0){

        let what_variable_to_scramble = [];
        let lastIndex = 0;

        let tempString = data_string;
        let find_var = variable_names.at((Math.floor(Math.random()* variable_names.length)));

        while(tempString.indexOf(find_var, lastIndex) != -1 ){
            what_variable_to_scramble.push(tempString.indexOf(find_var, lastIndex));

            lastIndex = tempString.indexOf(find_var, lastIndex) + find_var.length;
        }  
  
     for(let counter = 0; counter < find_var.length - 1; counter++){
     
         if(find_var.length % counter == 0 && counter > 0){
            // Steps are seperated for readablility
            let temp = find_var.substring(0, counter);
            temp = temp + find_var.at(counter + 1);
            temp = temp + find_var.at(counter) 
            temp = temp + find_var.substring(counter + 2, find_var.length);
            find_var = temp;
         }
       }
       
   // console.log(find_var);

    let the_exact_one = what_variable_to_scramble.at((Math.floor(Math.random()* what_variable_to_scramble.length)))
    tempString = data_string.substr(0, the_exact_one);
    tempString = tempString + find_var + data_string.substr(the_exact_one + find_var.length, data_string.length);

    return_string = tempString;

    if(data_string != return_string){
        successful = true;
    } 
    } 

    }
}
    return{
         didBug: successful,
        bugstring: return_string
    }
}


function bug(data_string, path){
   // console.log(data_string);
    console.log(path);

    let return_string = data_string;

    //  NOTE THIS IS WHAT IS DETREMINING HOW MANY BUGS ARE IN THE CODE IF THE NUBMER NEEDS TO BE ALTERED LOOK HERE first
    let randomNumberBug = (Math.floor(Math.random()* 10) + 1) ;// Since random is 0 inclusive 
    let numOfBugs = (getCodeLength(data_string) % randomNumberBug); 

  //  console.log(numOfBugs);

        //Choose what type of bug randomly
        //Choose what subjection of bug to insert
        //Insert the bug into the code by removing or inserting code
        // If the insertion is successful subtract the numOfBugs by 1
    let consecutive_unsuccesful_bugs = 0;
    // TEMPORARY RESERT OF NUMOF BUGS TO BE 1 always 
    numOfBugs = 1;
    while(numOfBugs > 0){
    
        let bug = (Math.floor(Math.random()* 10) % BUG_TYPE.MOD);
        let successful_bug;
    
       // if(bug === BUG_TYPE.FUNCTIONAL){
           // successful_bug = functional_bug(return_string, path);
            //return_string = successful_bug.bugstring;
       // }
       // else if(bug === BUG_TYPE.PREPROCESSOR){
           // successful_bug = preprocesser_bug(return_string, path);
           // return_string = successful_bug.bugstring;
       // } 
       // else if(bug === BUG_TYPE.SYNTAX){
             successful_bug = syntax_bug(return_string, path);
              return_string = successful_bug.bugstring;
              console.log(successful_bug.bugstring);
      //  }
    //successful_bug.didBug
        if(successful_bug.didBug){
            numOfBugs--;
        }
        else if(consecutive_unsuccesful_bugs == 2){
            break;
        }
        else{
            consecutive_unsuccesful_bugs++;
        }
    }

    // ONCE OUT OF THE WHILE LOOP HERE I WOULD WRITE TO THE FILE :) 
    // OR RETURN THE string and write where the bug funtion was called :)
  // console.log(return_string);

   console.log(" ");
}


function bug_files_command(){

    get_files_from_spider_directory(current_directory);

// Learned this here https://youtu.be/yQBw8skBdZU?si=bh5_ADuWAWO99xOI
    for(let i = 0; i < filesToModify.length ; i++){
        console.log("tring to read a file");
        fs.readFile(filesToModify.at(i), (err,data)=>{
          //  if(err) throw err;
                bug(data.toString(), filesToModify.at(i))
        })
    }  
    
    // for(let count_of_files = 0; count_of_files < filesToModify.length; count_of_files++){
    //     console.log("The file to modify is " + filesToModify.at(i));
    // }

}


// This is also being used a the test function for writing code that is ued for debugging but I ma not sure if it 
// Will esixt in the final product.
function hello_world_command(){
    // The code you place here will be executed every time your command is executed

         //get_new_folder_name()
        //  create_folder(current_directory)

      
          //vscode.window.showInformationMessage('Hello VS code!', true);

          //vscode.window.showInputBox();
         // vscode.window.showQuickPick("Create new directory", "Open existing directory", "More information about Spider");
}

/*
What I think I might do is create a copy of of all the files that are collected and put a copy of them
all into the smae folder that this extention runs and will delete if asked, that way the original files are never changed
but all their code is accessable to have, and then there could be a command called copy the bugged file over that copies it to 
the users file only if htey want to. This means that all of hte files can be put in the same file and displayed in the file tree 
at the same time which would be ideal.
*/
function updateSpiderStatusBar(text, tooltip, command) {
    //if the status bar has not been created yet
    if(spiderFileSelectStatusBarItem === null) {
        //add a item to the status bar
        spiderFileSelectStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);    
        spiderFileSelectStatusBarItem.text = text;
        spiderFileSelectStatusBarItem.tooltip = tooltip;
        spiderFileSelectStatusBarItem.command = command;
        spiderFileSelectStatusBarItem.show();
    } else { //the status bar has been created
        //update the existing status bar
        spiderFileSelectStatusBarItem.text = text;
        spiderFileSelectStatusBarItem.tooltip = tooltip;
        spiderFileSelectStatusBarItem.command = command;
    }
}

function updateSecondStatusBar(text, tooltip, command, show) {
    //if the status bar has not been created yet
    if (show === true){
        if(secondFileStatusBarItem === null) {
        //add a item to the status bar
        secondFileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);    
        secondFileStatusBarItem.text = text;
        secondFileStatusBarItem.tooltip = tooltip;
        secondFileStatusBarItem.command = command;
        secondFileStatusBarItem.show();
    } else { //the status bar has been created
        //update the existing status bar
        secondFileStatusBarItem.text = text;
        secondFileStatusBarItem.tooltip = tooltip;
        secondFileStatusBarItem.command = command;
    }
    }else{
        if(secondFileStatusBarItem != null) {
        secondFileStatusBarItem.hide();
        } 
    }
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}