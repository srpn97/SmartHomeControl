export const saveToLocalStorage = (key, value) => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (err) {
      console.error("Error saving to local storage", err);
    }
  };
  
  // Load data from local storage
  export const loadFromLocalStorage = (key) => {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return undefined; // No value found
      }
      return JSON.parse(serializedValue);
    } catch (err) {
      console.error("Error loading from local storage", err);
      return undefined;
    }
  };
  