#pragma once
#include <string>

using namespace std; 

class classOneAnimal
{
public:
    classOneAnimal(string t, string n);
    void animalInfo();
    void setAnimalType(string t);
    void setAnimalName(string n);
    void setAnimalAge(int numberOfHumanYears, int converstionRate);
    void setFavoriteNumber (int f);
    string getType();
    string getName();
    int getAge();
    int getFavoriteNumber();
    bool doesItMoo();

private:
    string type;
    string animalName;
    int age;
    int favoriteNumber;
};
