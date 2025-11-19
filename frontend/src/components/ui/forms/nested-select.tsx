import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";
import { FaRegPaste } from "react-icons/fa6";
import { inputClass } from "./inputClass";
import { LabelWithToolTip } from "./form-input";
import { getItemsAndCustomistions } from "../../../utils/generic-utils";
import PayloadEditor from "../mini-components/payload-editor";

interface SelectedItem {
  id: string;
  customisations: string[];
  relation: Record<string, string>;
  lastCustomisation?: string;
}

const ItemCustomisationSelector = ({
  // register,
  name,
  label,
  setValue,
}: any) => {
  const [items, setItems] = useState<SelectedItem[]>([
    { id: "", customisations: [], relation: {} },
  ]);
  const [catalogData, setCatalogData] = useState(null);
  const [errroWhilePaste, setErrroWhilePaste] = useState("");
  const [itemsList, setItemsList] = useState<any>({});
  const [categoryList, setCategoryList] = useState<any>({});
  const [groupMapping, setGroupMapping] = useState<any>({});
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);

  useEffect(() => {
    setValue(name, items);
  }, [items]);

  const handleItemChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = { id: value, customisations: [], relation: {} };
    setItems(updated);
  };

  const handleCustomisationChange = (
    index: number,
    value: string,
    group?: string
  ) => {
    if (!items[index].customisations.includes(value)) {
      const updated = [...items];
      updated[index].relation[`${value}`] = groupMapping[value];
      updated[index].customisations.push(value);
      if (group) {
        updated[index].lastCustomisation =
          categoryList[group].items[value].child;
      }
      setItems(updated);
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: "", customisations: [], relation: {} }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async (parsedText: any) => {
    setIsPayloadEditorActive(false);

    try {
      if (!parsedText?.context?.domain) {
        throw new Error("Domain not present");
      }

      if (!parsedText?.message?.catalog?.["bpp/providers"]) {
        throw new Error("Providers not presnt");
      }

      setCatalogData(parsedText);
      const response = getItemsAndCustomistions(parsedText);
      setItemsList(response?.itemList || {});
      setCategoryList(response?.catagoriesList || {});
      setGroupMapping(response?.cutomistionToGroupMapping || {});
    } catch (err: any) {
      setErrroWhilePaste(err.message || "Something went wrong");
      console.error("Error while handling paste: ", err);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
      <div className="flex flex-direction-row gap-4">
        <LabelWithToolTip labelInfo="" label={label} />
        <>
          {errroWhilePaste && (
            <p className="text-red-500 text-sm italic mt-1 w-full">
              {errroWhilePaste}
            </p>
          )}
          <button
            type="button"
            onClick={() => setIsPayloadEditorActive(true)}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <FaRegPaste size={14} />
          </button>
        </>

        {catalogData && (
          <button
            type="button"
            onClick={addItem}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <FaPlus size={14} />
          </button>
        )}
      </div>

      {catalogData ? (
        <>
          {items.map((item: any, index: number) => {
            let availableCustomisations: any = [];

            if (item?.id) {
              let customisationsObj: any = {};

              if (item?.lastCustomisation) {
                item.lastCustomisation.forEach((lastCustom: any) => {
                  customisationsObj = {
                    ...customisationsObj,
                    ...categoryList[lastCustom]?.items,
                  };
                  return categoryList[lastCustom]?.items || {};
                });
              } else {
                customisationsObj =
                  categoryList[itemsList[`${item?.id}`]]?.items || {};
              }

              const cutomistions = Object.entries(customisationsObj).map(
                (item) => {
                  console.log("iten", item);
                  const [key, _] = item;
                  return key;
                }
              );

              availableCustomisations = cutomistions;
              console.log(">>>>>", cutomistions);
            }

            return (
              <div
                key={index}
                className="relative border p-4 rounded bg-white shadow space-y-4"
              >
                {index !== 0 && (
                  <div className="absolute top-[-10px] right-[-10px] bg-white">
                    <button
                      onClick={() => removeItem(index)}
                      className=" p-2 border rounded-full hover:bg-gray-100"
                    >
                      <FaMinus size={14} />
                    </button>
                  </div>
                )}

                <LabelWithToolTip labelInfo="" label={"Item"} />

                <select
                  className={inputClass}
                  value={item.id}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                >
                  <option value="">Select Item</option>
                  {Object.entries(itemsList).map((key, index) => {
                    const [item, _] = key;
                    return (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    );
                  })}
                </select>

                {/* Customisation Selector */}
                {item.id && (
                  <>
                    <LabelWithToolTip labelInfo="" label={"Customisation"} />
                    <div className="flex gap-2 ">
                      <select
                        className={inputClass}
                        value=""
                        onChange={(e) =>
                          handleCustomisationChange(
                            index,
                            e.target.value,
                            groupMapping[e.target.value] ||
                              itemsList[`${item?.id}`]
                          )
                        }
                      >
                        <option value="">Select Customisation</option>
                        {availableCustomisations.map((c: any) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.customisations.map((c: any, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <div className="flex items-start gap-3 border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
          <p className="text-sm text-blue-800 flex items-center gap-1">
            Paste <strong>on_search</strong> payload using the button
            <span className="p-2 border rounded-full hover:bg-gray-100">
              <FaRegPaste size={14} />
            </span>
            to select items
          </p>
        </div>
      )}
    </div>
  );
};

export default ItemCustomisationSelector;
