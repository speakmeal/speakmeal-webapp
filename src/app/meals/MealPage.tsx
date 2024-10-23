import { useEffect, useState } from "react";
import { emptyFoodItem, FoodItem, Meal, MealType } from "../types_db";
import { useAlert } from "../Components/Alert/useAlert";
import { useRouter } from "next/navigation";
import { createClient } from "../Utils/supabase/client";
import { formatDate, getTotals } from "../Utils/helpers";
import LoadingIndicator from "../Components/LoadingIndicator";
import DashNavbar from "../Components/DashNavbar";
import Alert from "../Components/Alert/Alert";
import FoodItemElement from "./FoodItemElement";
import PieChart from "./PieChart";
import FoodItemModal from "./FoodItemModal";

interface Props {
  mealDataProp: Meal;
  isNew: boolean;
  hasNavbar: boolean;
  redirect?: string;
}

const MealPage: React.FC<Props> = ({
  mealDataProp,
  isNew,
  hasNavbar,
  redirect = "/dashboard",
}: Props) => {
  const [mealData, setMealData] = useState<Meal>(mealDataProp); //determine the type of meal being added
  const [foodItems, setFoodItems] = useState<FoodItem[]>(
    mealDataProp.food_item
  ); //list of foot items added to the list

  const [currentFood, setCurrentFood] = useState<FoodItem>(emptyFoodItem); //food item being edited / created
  const [editingIndex, setEditingIndex] = useState<number | null>(null); //index of food item being edited / created
  const [showModal, setShowModal] = useState<boolean>(false); //determine whether pop-up should be shown or not

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  const mealTypes = [
    { type: "Breakfast", icon: "🥚" },
    { type: "Lunch", icon: "🥗" },
    { type: "Dinner", icon: "🍕" },
    { type: "Snack", icon: "🍿" },
  ];

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
      //update existing food item
      const updatedFoodItems = foodItems.map((item, index) =>
        index === editingIndex ? currentFood : item
      );
      setFoodItems(updatedFoodItems);
    } else {
      //add new food item
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
    if (!isNew) {
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
        isNew
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
    router.push(redirect);
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

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-black">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen flex flex-col w-full">
      <div className="flex-grow">
        {hasNavbar && (
          <div className="pt-5">
            <DashNavbar />
          </div>
        )}

        <div className="ml-5">
          {showAlert && <Alert message={message} type={type} />}
        </div>

        <div className="p-6 bg-gray-600 bg-opacity-30 rounded-lg shadow-md md:m-4">
          {foodItems.length > 0 && (
            <div className="flex flex-row space-x-5 justify-start items-center">
              <div className="text-center">
                <button className="btn btn-primary px-10" onClick={saveMeal}>
                  Save Meal
                </button>
              </div>
              {!isNew && (
                <div>
                  <button
                    className="btn btn-error text-white hover:bg-red-600 w-32"
                    onClick={deleteMeal}
                  >
                    Delete meal
                  </button>
                </div>
              )}
            </div>
          )}
          <h2 className="text-4xl font-bold mb-4 text-center text-white">
            {isNew ? "New Meal" : formatDate(mealData.created_at)}
          </h2>

          <div className="flex flex-col justify-center items-center mt-5 w-full">
            <div>
              <p className="block text-lg text-white mb-3">Meal Type:</p>
            </div>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              {mealTypes.map((meal) => {
                return (
                  <button
                    key={meal.type}
                    className={`btn btn-primary text-white ${
                      mealData.type === meal.type &&
                      "bg-red-500 hover:bg-red-600"
                    }`}
                    onClick={() =>
                      setMealData((prev) => ({
                        ...prev,
                        type: meal.type as MealType,
                      }))
                    }
                  >
                    <span>
                      {meal.type} {meal.icon}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4 text-center mt-5">
            <button className="btn btn-primary" onClick={handleAddFoodItem}>
              Add Food Item
            </button>
          </div>

          {foodItems.length > 0 && (
            <>
              <div className="mt-5">
                <h1 className="text-xl text-white mb-2">Meal Items</h1>
              </div>

              <div className="mb-4 h-[50vh] overflow-y-scroll bg-gray-600 bg-opacity-25 shadow-lg overflow-x-auto rounded-lg flex flex-col">
                <div className="space-y-5 p-5 w-full">
                  {foodItems.map((item, index) => (
                    <FoodItemElement
                      key={index}
                      item={item}
                      index={index}
                      handleEditFoodItem={handleEditFoodItem}
                      handleDeleteFoodItem={handleDeleteFoodItem}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4 mt-5 text-center">
                <h3 className="text-xl font-bold text-white">Meal Breakdown</h3>

                <div>
                  <PieChart
                    chartData={{
                      "Carbohydrates (g)": totals.carbs_g.toFixed(2),
                      "Protein (g)": totals.protein_g.toFixed(2),
                      "Fat (g)": totals.fat_g.toFixed(2),
                    }}
                  />
                </div>
              </div>

              <h1 className="text-[#53ac00] text-center mt-5">
              🍽️ Total Calories: {" "}
                <b>{foodItems.reduce((total, item) => (total += item.calories), 0)} 🔥</b>
              </h1>
            </>
          )}

          {showModal && (
            <FoodItemModal
              currentFood={currentFood}
              handleInputChange={handleInputChange}
              handleSaveFoodItem={handleSaveFoodItem}
              setShowModal={setShowModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MealPage;
