"use client";

import {
  emptyFoodItem,
  emptyMeal,
  FoodItem,
  Meal,
  MealType,
} from "@/app/types_db";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/Components/Alert/useAlert";
import Alert from "@/app/Components/Alert/Alert";
import LoadingIndicator from "@/app/Components/LoadingIndicator";
import { createClient } from "@/app/Utils/supabase/client";
import DashNavbar from "@/app/Components/DashNavbar";
import { formatDate, getTotals } from "@/app/Utils/helpers";

//Note: to create a new meal, the id is set to 'new'
interface Params {
  id: string;
}

interface RouteParams {
  params: Params;
}

const NewMeal: React.FC<RouteParams> = ({ params: { id } }: RouteParams) => {
  const [mealData, setMealData] = useState<Meal>(emptyMeal); //determine the type of meal being added
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]); //list of foot items added to the list

  const [currentFood, setCurrentFood] = useState<FoodItem>(emptyFoodItem); //food item being edited / created
  const [editingIndex, setEditingIndex] = useState<number | null>(null); //index of food item being edited / created
  const [showModal, setShowModal] = useState<boolean>(false); //determine whether pop-up should be shown or not

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  /**
   * Show pop-up to add new food item
   */
  const handleAddFoodItem = () => {
    setShowModal(true);
    setCurrentFood(emptyFoodItem);
    setEditingIndex(null);
  };

  /**
   * Update the list of saved food item when save button in pop-up is pressed
   */
  const handleSaveFoodItem = () => {
    if (editingIndex !== null) {
      //add new item
      const updatedFoodItems = foodItems.map((item, index) =>
        index === editingIndex ? currentFood : item
      );
      setFoodItems(updatedFoodItems);
    } else {
      //update existing item
      setFoodItems([...foodItems, currentFood]);
    }
    setShowModal(false);
  };

  /**
   * Open the pop-up populated with the values of the food item being edited
   * @param index Index of food item being edited
   */
  const handleEditFoodItem = (index: number) => {
    setShowModal(true);
    setCurrentFood(foodItems[index]);
    setEditingIndex(index);
  };

  /**
   * Delete a food item
   * @param index Index of food item being deleted
   */
  const handleDeleteFoodItem = (index: number) => {
    const updatedFoodItems = foodItems.filter((_, i) => i !== index);
    setFoodItems(updatedFoodItems);
  };

  /**
   * Update the state of the current food variable when a value in the inputs of the pop-up changes
   * @param e input change event
   */
  const handleInputChange = (name: string, val: number | string) => {
    setCurrentFood((prevFood: FoodItem) => ({
      ...prevFood,
      [name]: val,
    }));
  };

  //get the total for macros and calories for the meal
  const totals = getTotals(foodItems);

  /**
   * Save the meal to the database
   */
  const saveMeal = async () => {
    if (mealData.type === "") {
      triggerAlert("You must select a meal type", "error");
      return;
    }
    setIsLoading(true);

    //if user is making changes to existing meal, the meal must be deleted first before adding everything again
    if (id !== "new") {
      const { error } = await supabase
        .from("meal")
        .delete()
        .eq("id", mealData.id);

      if (error) {
        triggerAlert(error.message, "error");
        setIsLoading(false);
        return;
      }
    }

    //now, one can just add the meal and its items to the database
    //get the user from the db
    const {
      data: { user },
    } = await supabase.auth.getUser();

    //add entry to database for new meal
    const { data: dbMeal, error: mealError } = await supabase
      .from("meal")
      .insert(
        id === "new"
          ? {
              type: mealData.type,
              owner_id: user?.id,
            }
          : {
              type: mealData.type,
              owner_id: mealData.owner_id,
              created_at: mealData.created_at, //ensure that time of creation is not changed for existing meal
            }
      )
      .select()
      .single();

    if (mealError) {
      triggerAlert(mealError.message, "error");
      setIsLoading(false);
      return;
    }

    //add entries for food items associated with the new meal
    const { error: itemsError } = await supabase.from("food_item").insert(
      foodItems.map((item) => ({
        food_name: item.food_name,
        carbs_g: item.carbs_g,
        protein_g: item.protein_g,
        fat_g: item.fat_g,
        calories: item.calories,
        meal_id: dbMeal.id,
      }))
    );

    if (itemsError) {
      triggerAlert(itemsError.message, "error");
      setIsLoading(false);
      return;
    }

    //meal was saved successfully, so redirect user to the dashboard
    router.push("/dashboard");
  };

  //delete existing meal from the database
  const deleteMeal = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from("meal")
      .delete()
      .eq("id", mealData.id);

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    //meal was deleted successfully, so redirect the user to the logs section
    router.push("/logs");
  };

  //load meal data on page load if necessary
  const onPageLoad = async () => {
    setIsLoading(true);

    if (!isNaN(parseInt(id))) {
      //if id is a valid number, then user wants to edit existing meal
      //hence, load the information for the meal selected
      const { data: meal, error: mealError } = await supabase
        .from("meal")
        .select("*, food_item(*)")
        .eq("id", parseInt(id))
        .single();

      if (mealError) {
        setIsLoading(false);
        triggerAlert(mealError.message, "error");
        return;
      }

      setFoodItems(meal.food_item);
      setMealData(meal);
      setIsLoading(false);
    } else {
      //id is some text that is not /new (invalid)
      if (id !== "new") {
        router.push("/dashboard");
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    onPageLoad();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashNavbar redirectPath="/dashboard" />

      <div className="p-6 bg-white rounded-lg shadow-md m-4">
        <h2 className="text-4xl font-bold mb-4 text-center">
          {id === "new" ? "New Meal" : formatDate(mealData.created_at)}{" "}
        </h2>

        <div className="flex flex-row space-x-5 justify-center px-5 items-center mt-5">
          <div>
            <label className="block text-gray-700">Meal Type:</label>
          </div>

          <div>
            <select
              className="select select-bordered w-full mt-1"
              value={mealData.type}
              onChange={(e) =>
                setMealData((prev) => ({
                  ...prev,
                  type: e.target.value as MealType,
                }))
              }
            >
              <option value="">Select Meal Type</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <h1 className="text-xl text-black mb-2">Meal Breakdown</h1>
          <div className="mb-4 h-[30vh] overflow-y-scroll border-2 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Carbohydrates (g)</th>
                  <th>Protein (g)</th>
                  <th>Fat (g)</th>
                  <th>Calories</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {foodItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.food_name}</td>
                    <td>{item.carbs_g}</td>
                    <td>{item.protein_g}</td>
                    <td>{item.fat_g}</td>
                    <td>{item.calories}</td>
                    <td>
                      <button
                        className="text-blue-500"
                        onClick={() => handleEditFoodItem(index)}
                      >
                        <FaEdit />
                      </button>
                    </td>
                    <td>
                      <button
                        className="text-red-500"
                        onClick={() => handleDeleteFoodItem(index)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul></ul>
          </div>

          <div className="mb-4">
            <button className="btn btn-primary" onClick={handleAddFoodItem}>
              Add Food Item
            </button>
          </div>
        </div>

        <div className="mb-4 mt-5 text-center">
          <h3 className="text-xl font-bold text-purple-700">Meal Totals</h3>

          <div className="w-full flex flex-row justify-center">
            <table className="table w-64">
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Carbohydrates (g)</td>
                  <td>{totals.carbs_g}</td>
                </tr>
                <tr>
                  <td>Protein (g)</td>
                  <td>{totals.protein_g}</td>
                </tr>
                <tr>
                  <td>Fat (g)</td>
                  <td>{totals.fat_g}</td>
                </tr>
                <tr>
                  <td>Calories</td>
                  <td>{totals.calories}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-row space-x-5 justify-center items-cente mt-5">
          <div className="text-center">
            <button
              className="btn rounded-full bg-lime-500 text-white hover:bg-purple-500 w-32"
              onClick={saveMeal}
            >
              Save Meal
            </button>
          </div>
          {id !== "new" && (
            <div>
              <button
                className="btn btn-error rounded-full text-white hover:bg-red-600 w-32"
                onClick={deleteMeal}
              >
                Delete meal
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-xl font-bold text-purple-700 mb-4">
                AddFood Item
              </h3>
              <div className="mb-4">
                <label className="block text-gray-700">Name:</label>
                <input
                  className="input input-bordered w-full mt-1"
                  name="food_name"
                  value={currentFood.food_name}
                  onChange={(e) =>
                    handleInputChange("food_name", e.target.value)
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Carbohydrates (g):
                </label>
                <input
                  className="input input-bordered w-full mt-1"
                  name="carbs_g"
                  type="number"
                  value={currentFood.carbs_g}
                  onChange={(e) =>
                    handleInputChange("carbs_g", parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Protein (g):</label>
                <input
                  className="input input-bordered w-full mt-1"
                  name="protein_g"
                  type="number"
                  value={currentFood.protein_g}
                  onChange={(e) =>
                    handleInputChange("protein_g", parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Fat (g):</label>
                <input
                  className="input input-bordered w-full mt-1"
                  name="fat_g"
                  type="number"
                  value={currentFood.fat_g}
                  onChange={(e) =>
                    handleInputChange("fat_g", parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Calories (kcal):</label>
                <input
                  className="input input-bordered w-full mt-1"
                  name="calories"
                  type="number"
                  value={currentFood.calories}
                  onChange={(e) =>
                    handleInputChange("calories", parseFloat(e.target.value))
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  className="btn btn-primary mr-2"
                  onClick={handleSaveFoodItem}
                >
                  Save
                </button>
                <button className="btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default NewMeal;
