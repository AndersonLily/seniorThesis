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

let original_files = [];
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
    context.subscriptions.push(vscode.commands.registerCommand('spider.ReadandBugFilesSyntax', bug_only_syntax_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.ReadandBugFilesFunctional', bug_only_functional_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.ReadandBugFilesPreprocessor', bug_only_preprocessor_command));
    context.subscriptions.push(vscode.commands.registerCommand('spider.Reveal_bugs', reveal_added_bugs));

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
            let startOfType = (value.at(0).path).lastIndexOf('.');
            let fileType = value.at(0).path.slice(startOfType, value.at(0).path.length);

            if(fileType === ".c" || fileType === ".cpp" || fileType === ".h"){
            filesToModify.push(value.at(0));
            original_files.push(value.at(0));
            get_new_folder_name();
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

function getAllVariableTypes (data_string){
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

    return just_variable_vector;
}
function getAllVariableNames(data_string){
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

function locationInBraces(data_string){
     // This will return a random value that is within braces
     let return_val = 0;
     let BracesisPresent = [];
     // Finding the location of all the parenthesis 
     for(let counter = 0; counter < data_string.length; counter++){
         // If the # is present put it into the define_present
         if(data_string.at(counter) == '{'){
            BracesisPresent.push(counter);
         }
     }

     if(BracesisPresent.length != 0){
         let toAddNextToo = (Math.floor(Math.random()* BracesisPresent.length));
         for(let i = BracesisPresent.at(toAddNextToo); i < data_string.length; i++)
         {
            if(data_string.at(i) == '\r\n' || data_string.at(i) == ';'){
                return_val =  i + 1;
                break;
             }else if(data_string.at(i) == '}'){
                return_val =  i - 1;
                break;
             }
         }
     }
    return return_val;
}

function functional_bug(data_string, path){
// change the data stirng 
let successful = false;
let return_string = data_string;

let what_switch = (Math.floor(Math.random()* 8));
switch(5){
    case 0:
        // Add an infinite for loop 
         const where_to_inf_for = locationInBraces(data_string);

          return_string = data_string.substring(0, where_to_inf_for);
          return_string =  return_string + "\n      for(int i = 0; i < 10; i++){\n          i--;\n        }" + data_string.substring(where_to_inf_for, data_string.length);
        break;
    case 1:
        let var_names = getAllVariableNames(data_string);

        if (var_names.length != 0){
            let tempString = data_string;
            let find_var = var_names.at((Math.floor(Math.random()* var_names.length)));
    
            let what_variable_to_delete = data_string.indexOf(find_var, 0);

            let right_end = 0;
            let left_end = 0;


            for(let counter = data_string.indexOf(find_var, 0); counter < data_string.length; counter ++){

                if(data_string.at(counter) == ";" || data_string.at(counter) == "(" || data_string.at(counter) == "\r\n" || data_string.at(counter) == "," || data_string.at(counter) == ")" || data_string.at(counter) == "}" || data_string.at(counter) == "{"){
                   if(data_string.at(counter) == ";"){
                    right_end = counter + 1;
                   }else {
                    right_end = counter;
                   }
                    break;
                }
            }
            // Find where the variable declaration left end
            for(let counter = data_string.indexOf(find_var, 0); counter > 0; counter--){
                if(data_string.at(counter) == ";" || data_string.at(counter) == "(" || data_string.at(counter) == "\r\n" || data_string.at(counter) == "," || data_string.at(counter) == ")" || data_string.at(counter) == "}" || data_string.at(counter) == "{"){
                    left_end = counter + 1;
                    break;
                }
            }
            return_string = data_string.substr(0, left_end) + data_string.substr(right_end, data_string.length);
        } 
        break;
    case 2:
        // This will switch the > or < around in any statment NOTE This also will cause a syntax error with << or >> 
        let signPresent = [];
            // Finding the location of all the qoutes 
            for(let counter = 0; counter < data_string.length; counter++){
                if(data_string.at(counter) == "<" || data_string.at(counter) == ">"){
                    signPresent.push(counter);
                }
            }

            if(signPresent.length != 0){
                let locationOfsign = (Math.floor(Math.random()* signPresent.length));
                if(data_string.at(signPresent.at(locationOfsign)) == ">"){
                    return_string = data_string.substr(0, signPresent.at(locationOfsign) - 1) + "<";
                }
                else{
                    return_string = data_string.substr(0, signPresent.at(locationOfsign) - 1) + ">";
                }

               return_string = return_string + data_string.substr(signPresent.at(locationOfsign), data_string.length);
            }
        break;
    case 3:
        // This will put a variable on the heap that is not deleted causing a memory leak
        let all_vars = getAllVariableTypes(data_string);

        let what_to_put_on_heap = (Math.floor(Math.random()* all_vars.length));
        let location = locationInBraces(data_string);
        return_string = data_string.substr(0, location) + "\r\n   " + all_vars.at(what_to_put_on_heap) + "* num = new " + all_vars.at(what_to_put_on_heap) + "; \r\n" + data_string.substr(location + 1, data_string.length);
        break;
    case 4:
         // This will remove a * or & operator (This will remove multiplication instances and affect logical and 
         //                                     but is targeting pointers and references)
         let starAmpPresent = [];
         // Finding the location of all the * and &
         for(let counter = 0; counter < data_string.length; counter++){
             if(data_string.at(counter) == '*' || data_string.at(counter) == '&'){
                starAmpPresent.push(counter);
             }
         }

         if(starAmpPresent.length != 0){
             // Grab the string to remove from the string of all the text in the .cpp or .h file
             let toRemove = (Math.floor(Math.random()* starAmpPresent.length));
             return_string = data_string.substr(0, starAmpPresent.at(toRemove));
             return_string = return_string + data_string.substr(starAmpPresent.at(toRemove) + 1, data_string.length);
         }

        break;
    case 5:
        // This will delete the left or right side of an equation

        let equal_location = [];

        for(let counter = 0; counter < data_string.length; counter++){
            if(data_string.at(counter) == '='){
                equal_location.push(counter);
            }
        }

        if(equal_location.length != 0){
            let which_equal = (Math.floor(Math.random()* equal_location.length));

            //
            const delete_right = Math.random() < 0.5

            if(delete_right){
                let right_end;
                for(let counter = equal_location.at(which_equal); counter < data_string.length; counter++){                
                      if(data_string.at(counter) == ";" || data_string.at(counter) == "\r\n" ){
                       if(data_string.at(counter) == ";"){
                        right_end = counter + 1;
                       }else {
                        right_end = counter;
                       }
                        break;
                    }
                }

                return_string = data_string.substr(0, equal_location.at(which_equal) - 1) + data_string.substr(right_end, data_string.length);
            }
            else{
                let left_end;
                for(let counter = equal_location.at(which_equal); counter > 0; counter--){
                    if(data_string.at(counter) == ";" || data_string.at(counter) == "(" || data_string.at(counter) == "\r\n" ||  data_string.at(counter) == ")" || data_string.at(counter) == "}" || data_string.at(counter) == "{"){
                                    left_end = counter + 1;
                                    break;
                     }
                }

                return_string = data_string.substr(0, left_end) + "\n" + data_string.substr(equal_location.at(which_equal), data_string.length);
            }
        }
        break;
    case 6:
        // This will remove the a for loop declaration and ending brace but leave the internal logic
        let forPresent = [];

        let tempString = data_string;
        let lastIndex = 0;
        let looking_str = "for";
        // Finding the location of all the preprocessor commands
        while(tempString.indexOf(looking_str, lastIndex) != -1 ){
                forPresent.push(tempString.indexOf(looking_str, lastIndex));
                lastIndex = tempString.indexOf(looking_str, lastIndex) + looking_str.length
        }

        if(forPresent.length != 0){
            // Grab the string to remove from the string of all the text in the .cpp or .h file
            let toRemove = (Math.floor(Math.random()* forPresent.length));
            let openBrace = data_string.indexOf( "{", forPresent.at(toRemove));
            let closeBrace = data_string.indexOf("}", openBrace + 1);
            return_string = data_string.substr(0, forPresent.at(toRemove)) + data_string.substr(openBrace + 1, closeBrace - openBrace - 1)  +  data_string.substr(closeBrace + 1 , data_string.length);
        }
       
        break;
    case 7:
        // This will change the order of parameters passed into a function.
        // TODO: THIS CASE :)
        break;
        
    case 8:
        // This will add a little bug emoji.
        // TODO: THIS CASE :)
        break;  
        default:
        // This will create a null pointer and dereference it.
        let where_to_insert_seg_fault = locationInBraces(data_string);
        return_string = data_string.substring(0, where_to_inf_for);
        return_string =  return_string + "\n      int* p_int = NULL;\n      int oh_no = *p_int;\n" + data_string.substring(where_to_inf_for, data_string.length);
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
        let variable_names = getAllVariableNames(data_string);

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
    console.log(path);

    let return_string = data_string;

    let randomNumberBug = (Math.floor(Math.random()* 3) + 1) ;// Since random is 0 inclusive 
    let numOfBugs = (getCodeLength(data_string) % randomNumberBug); 

        //Choose what type of bug randomly
        //Choose what subjection of bug to insert
        //Insert the bug into the code by removing or inserting code
        // If the insertion is successful subtract the numOfBugs by 1
    let consecutive_unsuccesful_bugs = 0;
    // TEMPORARY RESET OF NUM OF BUGS TO BE 1 always 
    numOfBugs = 2;
    while(numOfBugs > 0){
    
        let bug = (Math.floor(Math.random()* 10) % BUG_TYPE.MOD);
        let successful_bug;
    
        if(bug === BUG_TYPE.FUNCTIONAL){
           successful_bug = functional_bug(return_string, path);
            return_string = successful_bug.bugstring;
        }
        else if(bug === BUG_TYPE.PREPROCESSOR){
            successful_bug = preprocesser_bug(return_string, path);
            return_string = successful_bug.bugstring;
        } 
        else if(bug === BUG_TYPE.SYNTAX){
             successful_bug = syntax_bug(return_string, path);
              return_string = successful_bug.bugstring;
       }

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
    fs.writeFile(path, return_string, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    })
}

//function

function only_syntax(data_string, path){
    console.log(path);

    let return_string = data_string;
    let randomNumberBug = (Math.floor(Math.random()* 3) + 1) ;// Since random is 0 inclusive 
    let numOfBugs = (getCodeLength(data_string) % randomNumberBug); 

    //Choose what type of bug randomly
    //Choose what subjection of bug to insert
    //Insert the bug into the code by removing or inserting code
    // If the insertion is successful subtract the numOfBugs by 1
    let consecutive_unsuccesful_bugs = 0;
    // TEMPORARY RESET OF NUM OF BUGS TO BE 1 always 
    numOfBugs = 1;
    while(numOfBugs > 0){
    
        let successful_bug;

        successful_bug = syntax_bug(return_string, path);
        return_string = successful_bug.bugstring;
       
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
    fs.writeFile(path, return_string, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    })
}

function only_functional(data_string, path){
    console.log(path);

    let return_string = data_string;
    let randomNumberBug = (Math.floor(Math.random()* 3) + 1) ;// Since random is 0 inclusive 
    let numOfBugs = (getCodeLength(data_string) % randomNumberBug); 

    //Choose what type of bug randomly
    //Choose what subjection of bug to insert
    //Insert the bug into the code by removing or inserting code
    // If the insertion is successful subtract the numOfBugs by 1
    let consecutive_unsuccesful_bugs = 0;
    // TEMPORARY RESET OF NUM OF BUGS TO BE 1 always 
    numOfBugs = 1;
    while(numOfBugs > 0){
    
        let successful_bug;

        successful_bug = functional_bug(return_string, path);
        return_string = successful_bug.bugstring;
       
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
    fs.writeFile(path, return_string, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    })
}

function only_preprocessor(data_string, path){
    console.log(path);

    let return_string = data_string;
    let randomNumberBug = (Math.floor(Math.random()* 3) + 1) ;// Since random is 0 inclusive 
    let numOfBugs = (getCodeLength(data_string) % randomNumberBug); 

    //Choose what type of bug randomly
    //Choose what subjection of bug to insert
    //Insert the bug into the code by removing or inserting code
    // If the insertion is successful subtract the numOfBugs by 1
    let consecutive_unsuccesful_bugs = 0;
    // TEMPORARY RESET OF NUM OF BUGS TO BE 1 always 
    numOfBugs = 1;
    while(numOfBugs > 0){
    
        let successful_bug;

        successful_bug = preprocesser_bug(return_string, path);
        return_string = successful_bug.bugstring;
       
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
    fs.writeFile(path, return_string, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    })
}

function bug_files_command(){
    get_files_from_spider_directory(current_directory);
// Learned this here https://youtu.be/yQBw8skBdZU?si=bh5_ADuWAWO99xOI
    for(let i = 0; i < filesToModify.length ; i++){
        fs.readFile(filesToModify.at(i), (err,data)=>{
          //  if(err) throw err;
            bug(data.toString(), filesToModify.at(i))
        })
    }  
}

function bug_only_syntax_command(){
    get_files_from_spider_directory(current_directory);

    for(let i = 0; i < filesToModify.length ; i++){
        fs.readFile(filesToModify.at(i), (err,data)=>{
          //  if(err) throw err;
            only_syntax(data.toString(), filesToModify.at(i))
        })
    }  
}

function bug_only_functional_command(){
    get_files_from_spider_directory(current_directory);

    for(let i = 0; i < filesToModify.length ; i++){
        fs.readFile(filesToModify.at(i), (err,data)=>{
          //  if(err) throw err;
            only_functional(data.toString(), filesToModify.at(i))
        })
    }  
}

function bug_only_preprocessor_command(){
    get_files_from_spider_directory(current_directory);

    for(let i = 0; i < filesToModify.length ; i++){
        fs.readFile(filesToModify.at(i), (err,data)=>{
          //  if(err) throw err;
            only_preprocessor(data.toString(), filesToModify.at(i))
        })
    }  
}



function compare_the_files(data_of_original, data_of_bugged){
    let return_string = data_of_bugged;
    let offset_for_return_string = 0;
    let offset_for_the_orignal_string = 0;
    let offset_for_the_bugged_string = 0;
    let bug_message = "\n/************BUG was added here************/\n";

    if(data_of_original === data_of_bugged){
        return_string = "/************NO BUGS WERE ADDED************/" + return_string;
    }
    else if(data_of_original.length <= data_of_bugged.length){

        for(let counter = 0; counter < data_of_original.length; counter++){
          // console.log(counter);
            if((counter + offset_for_the_orignal_string >= data_of_original.length) || (counter + offset_for_the_bugged_string >= data_of_bugged.length)){
                break;
            }

            if(data_of_original.at(counter + offset_for_the_orignal_string) != data_of_bugged.at(counter  + offset_for_the_bugged_string)){
                // console.log(counter);
                // console.log(data_of_original.at(counter + offset_for_the_orignal_string));
                // console.log(data_of_bugged.at(counter));
                return_string = return_string.substr(0, (counter + offset_for_the_bugged_string + offset_for_return_string) -1) + bug_message + data_of_bugged.substr((counter + offset_for_the_bugged_string), data_of_bugged.length);
                // console.log(return_string);
                // console.log(" ");
                offset_for_return_string = offset_for_return_string + bug_message.length;

                let aligned = false;

                let old_counter = counter;

                //Offset for the bugged string
                while(data_of_original.at(old_counter + offset_for_the_orignal_string) != data_of_bugged.at(counter + offset_for_the_bugged_string) && (counter + offset_for_the_bugged_string) < data_of_bugged.length){
                    counter++;
                    if(data_of_original.at(old_counter + offset_for_the_orignal_string) == data_of_bugged.at(counter + offset_for_the_bugged_string) && data_of_original.at(old_counter  + offset_for_the_orignal_string+ 1) == data_of_bugged.at(counter + offset_for_the_bugged_string + 1)){
                        aligned = true;
                        offset_for_the_bugged_string = offset_for_the_bugged_string + (counter - old_counter);
                        counter = old_counter;
                        break;
                    }
                }

                if(!aligned){
                    // console.log("The bugged offset?");
                    // console.log(offset_for_the_bugged_string);
                    // console.log("The other offset?");
                    // console.log(offset_for_the_orignal_string);
                counter = old_counter;
                //Offset for the original string
                while(data_of_original.at(counter) != data_of_bugged.at(old_counter + offset_for_the_bugged_string) && (counter) < data_of_original.length){
                    counter++;
                    if(data_of_original.at(counter) == data_of_bugged.at(old_counter + offset_for_the_bugged_string)){
                       // one for the current character that mismatches
                        offset_for_the_orignal_string = offset_for_the_orignal_string + (counter - old_counter);
                       // console.log(offset_for_the_orignal_string);
                        counter = old_counter;
                        break;
                    }
                }
            }
         }
        }

        if(offset_for_the_bugged_string == 0 || (data_of_bugged.length - (data_of_original.length - offset_for_the_orignal_string)) != offset_for_the_bugged_string){
            return_string = return_string.substr(0, (data_of_original.length + offset_for_return_string + offset_for_the_bugged_string)) + bug_message + data_of_bugged.substr((data_of_original.length - offset_for_the_orignal_string + offset_for_the_bugged_string + 1), data_of_bugged.length);
        }

        console.log(offset_for_return_string);
        console.log(offset_for_the_orignal_string);
        console.log(offset_for_the_bugged_string);

    }else{
        // console.log("In the shorter than one");

        // for(let counter = 0; counter < (data_of_bugged.length  + offset_for_the_orignal_string); counter++){
        //     if(data_of_original.at(counter) != data_of_bugged.at(counter  + offset_for_the_orignal_string)){
        //         return_string = return_string.substr(0, (counter + offset_for_return_string)-1) + bug_message + return_string.substr((counter + offset_for_return_string), return_string.length);
        //         offset_for_return_string = offset_for_return_string + bug_message.length;

        //         let forward = false;

        //         let old_counter = counter;

        //         //Forward loop
        //         while(data_of_original.at(old_counter) != data_of_bugged.at(counter) && counter < data_of_bugged.length){
        //             counter++;
        //             console.log(counter);
        //             if(data_of_original.at(old_counter) == data_of_bugged.at(counter)){
        //                 forward = true;
        //                 offset_for_the_orignal_string = offset_for_the_orignal_string + old_counter - counter;
        //                 break;
        //             }
        //         }

        //         if(!forward){
        //              counter = old_counter;
        //             while(data_of_original.at(counter) != data_of_bugged.at(old_counter) && counter < data_of_original.length){
        //                 counter++;
        //                 console.log(counter);
        //                 if(data_of_original.at(counter) == data_of_bugged.at(old_counter)){
        //                     offset_for_the_orignal_string = offset_for_the_orignal_string + counter - old_counter;
        //                     break;
        //                 }
        //             }
        //         }
        //     }
        // }
    }

   return return_string;
}

function reveal_added_bugs(){

    if(false){
    for(let counter = 0; counter < filesToModify.length; counter++){
        let one = filesToModify.at(counter).lastIndexOf("/");
        let file_string = filesToModify.at(counter).substr(one, filesToModify.at(counter).length);

        let two = original_files.at(counter).path.lastIndexOf("/");
        let orig_string = original_files.at(counter).path.substr(two, original_files.at(counter).path.length);


        // Heres what will happen
        // where a change has been made enter ******BUG WAS ADDED HERE*******
        // write that to that changed file. 
        if(file_string == orig_string){

            let search = "C:\\";
            orig_string =  original_files.at(counter).path.substr(original_files.at(counter).path.indexOf(search) + search.length +1, original_files.at(counter).path.length);

            let data_of_original = null;
            let data_of_bugged = null;
                try {
                    data_of_original = fs.readFileSync(orig_string, 'utf8'); 
                } catch (err) {
                    console.error(err);
                }
 
                try {
                    data_of_bugged = fs.readFileSync(filesToModify.at(counter), 'utf8');
                } catch (err) {
                    console.error(err);
                }


            // write the string to the bugged file
            let newFileContents = compare_the_files(data_of_original, data_of_bugged);
            console.log(newFileContents);


            }else{
                console.error("Some issue occured with comparing a file");
            }
        }
    }else{
        let test1 = compare_the_files("Test Original string things have not been altered here", "Test Changed Original here string things AND HERE have not been altered here");
            console.log(test1);

        let test2 = compare_the_files("Test Original string things have not been altered here", "Test Original string things have not been altered here This");
            console.log(test2);

        let test3 = compare_the_files("Test Original string things have not been altered here", "Test Changed Original here string things AND HERE have not been altered here this");
            console.log(test3);

        let test4 = compare_the_files("Test Original string things have not been altered here", "Test Original string things have been altered here this");
             console.log(test4);

        let test5 = compare_the_files("Test Original string things have not been altered here", "Test Changed Original here string things AND HERE have been altered here this");
            console.log(test5);
    }
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