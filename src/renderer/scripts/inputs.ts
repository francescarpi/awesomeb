export type TSetDefault = (value: string, props?: { select?: boolean }) => void;
export type TSetValue = (value: string) => void;

export function inputManager(
  inputEl: HTMLInputElement,
  onAccept: (newValue: string) => void,
  onCancel: () => void,
  onChange?: (newValue: string) => void,
): {
  setDefaultValue: TSetDefault;
  setValue: TSetValue;
} {
  const setDefaultValue = (value: string, props?: { select?: boolean }) => {
    inputEl.defaultValue = value;
    if (inputEl.defaultValue.length > 0 && props?.select) {
      inputEl.select();
    }
  };

  const setValue = (value: string) => {
    inputEl.value = value;
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

  if (onChange) {
    inputEl.addEventListener('input', () => {
      onChange(inputEl.value);
    });
  }

  return { setDefaultValue, setValue };
}
