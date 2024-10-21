#include <iostream>
#include "classOneAnimal.h"

using namespace std;

/*
Now there is a class that holds most of the logic/ programming for this file, classes are very common in C++
programming, but they also make it harder to figure out where bugs are since you have to manage multiple files at a time.
This class also allocates memory on the Heap which as a programmer you want to always keep a close eye on.
*/
int main(){

    classOneAnimal cow1("cow", "Bessie");
    classOneAnimal cow2("cow", "Tank");
    classOneAnimal cow3("cow", "Cat");

    classOneAnimal snail("snail", "Speedy");

    /* This is using heap memory as was mentioned earlier always make sure something deletes anything that = new*/
    classOneAnimal* dog = new classOneAnimal("dog", "Sylvester");

    cow1.setAnimalAge(5, 3);
    cow2.setAnimalAge(6, 3);
    cow3.setAnimalAge(1, 3);

    snail.setAnimalAge(7, 15);

    dog->setAnimalAge(3, 7);

    cow1.setFavoriteNumber(45);
    cow2.setFavoriteNumber(3);
    cow3.setFavoriteNumber(-10);

    snail.setFavoriteNumber(19);

    dog->setFavoriteNumber(1);

    dog->animalInfo();

    snail.animalInfo();

    cow1.animalInfo();
    cow2.animalInfo();
    cow3.animalInfo();

    delete dog;

    return 0;
}