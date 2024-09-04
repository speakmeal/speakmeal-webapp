import { FoodItem } from "../types_db";

interface Props {
    currentFood: FoodItem;
    handleInputChange: (field: string, val: number | string) => void;
    handleSaveFoodItem: () => void;
    setShowModal: (isShow: boolean) => void;
}

const FoodItemModal: React.FC<Props> = ({ currentFood, handleInputChange, handleSaveFoodItem, setShowModal}: Props) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-xl font-bold text-white mb-4">Food item</h3>
          <div className="mb-4">
            <label className="block text-white">Name:</label>
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
            <label className="block text-white">Carbohydrates (g):</label>
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
            <label className="block text-white">Protein (g):</label>
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
            <label className="block text-white">Fat (g):</label>
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
            <label className="block text-white">Calories (kcal):</label>
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
    );
};

export default FoodItemModal;