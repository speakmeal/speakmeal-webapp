import { useState } from "react";
import { FoodItem } from "../types_db";
import NutrientBar from "./NutrientBar";
import { FaChevronDown, FaChevronUp, FaEdit, FaTrash } from "react-icons/fa";

interface Props {
    item: FoodItem, 
    index: number, 
    handleEditFoodItem: (index: number) => void, 
    handleDeleteFoodItem: (index: number) => void
}

const FoodItemElement = ({ item, index, handleEditFoodItem, handleDeleteFoodItem }: Props) => {
    const [showNutrition, setShowNutrition] = useState(false);
  
    return (
      <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">{item.food_name}</h3>
          <div className="flex space-x-2">
            <button
              className="text-blue-500"
              onClick={() => handleEditFoodItem(index)}
            >
              <FaEdit />
            </button>
            <button
              className="text-red-500"
              onClick={() => handleDeleteFoodItem(index)}
            >
              <FaTrash />
            </button>
          </div>
        </div>
        <button
          className="flex items-center text-gray-700"
          onClick={() => setShowNutrition(!showNutrition)}
        >
          {showNutrition ? <FaChevronUp /> : <FaChevronDown />}
          <span className="ml-2">{showNutrition ? 'Hide' : 'Show'} Nutrients</span>
        </button>
        <div className={`transition-all duration-300 ease-in-out ${showNutrition ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
          <div className="space-y-2 mt-3">
            <NutrientBar label="Carbohydrates (g)" value={item.carbs_g} color="bg-blue-500" />
            <NutrientBar label="Protein (g)" value={item.protein_g} color="bg-green-500" />
            <NutrientBar label="Fat (g)" value={item.fat_g} color="bg-red-500" />
            <NutrientBar label="Calories" value={item.calories} color="bg-yellow-500" />
          </div>
        </div>
      </div>
    );
  };

export default FoodItemElement;