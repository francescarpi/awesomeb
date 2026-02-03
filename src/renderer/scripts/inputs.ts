export function inputManager(
  inputEl: HTMLInputElement,
  onAccept: (newValue: string) => void,
  onCancel: () => void,
): {
  setDefaultValue: (value: string) => void;
} {
  const setDefaultValue = (value: string) => {
    inputEl.defaultValue = value;
    if (inputEl.defaultValue.length > 0) {
      inputEl.select();
    }
  };

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const newValue = inputEl.value.trim();
      if (newValue.length > 0) {
        onAccept(newValue);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  });

  return { setDefaultValue };
}
