#include "classOneAnimal.h"
#include <iostream>

using namespace std; 
classOneAnimal::classOneAnimal(string t, string n)
{
    setAnimalType(t);
    setAnimalName(n);
}

void classOneAnimal::animalInfo(){
    cout << "This animal is named: " << getName() << " and it is a: " << getType() << endl;
    cout << getName() << " is " << getAge() << " years old in " << getType() << " years" << endl;
    cout << "If you divided their age in " << getType() << " years by their favorite number " << getFavoriteNumber();
    cout << " you would get " << getAge()/getFavoriteNumber() << endl;
    cout << "It is " << doesItMoo() << " that this animal Moos";
}

void classOneAnimal::setAnimalType(string t){
    type = t;
}

void classOneAnimal::setAnimalName(string n){
    animalName = n;
}

void classOneAnimal::setAnimalAge(int numberOfHumanYears, int converstionRate){
    if(numberOfHumanYears > 0 && converstionRate > 0){
    age = numberOfHumanYears * converstionRate;
    } else{
        age = numberOfHumanYears * converstionRate * -1;
    }
}

void classOneAnimal::setFavoriteNumber (int f){
    favoriteNumber = f;
}

string classOneAnimal::getType(){
    return type;
}

string classOneAnimal::getName(){
    return animalName;
}

int classOneAnimal::getAge(){
    return age;
}

int classOneAnimal::getFavoriteNumber(){
    return favoriteNumber;
}

bool classOneAnimal::doesItMoo(){
    return "cow" == getType();
}