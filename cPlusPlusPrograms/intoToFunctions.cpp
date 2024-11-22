#include <iostream>
#include <cmath>

using namespace std;

/*
This program has a little more going on than the helloword.cpp there is functions as well as our main.
Notice how there are several variable declations, a for loop and a call to the function square_then_half,
when you run Spider any of these things can change.
*/

double square_then_half(int num);

int main(){

    int number_to_count = 10;

    for(int counter = 0; counter < number_to_count; counter++){
        cout << square_then_half(counter) << endl;
    }

    return 0;
}

double square_then_half(int num){
    double return_value = num * num;
    return_value = return_value/2.0;
    return return_value;
}