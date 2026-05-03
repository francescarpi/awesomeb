export type TSetDefault = (value: string, props?: { select?: boolean }) => void;
export type TSetValue = (value: string) => void;

export function inputManager(
  inputId: string,
  {
    onAccept,
    onCancel,
    onChange,
    allowEmpty = false,
  }: {
    onAccept: (newValue: string) => void;
    onCancel: () => void;
    onChange?: (newValue: string) => void;
    allowEmpty?: boolean;
  },
): {
  setDefaultValue: TSetDefault;
  setValue: TSetValue;
  setVisible: (visible: boolean) => void;
  focus: (select?: boolean) => void;
  getValue: () => string;
  inputEl: HTMLInputElement;
} {
  const inputEl = document.getElementById(inputId) as HTMLInputElement;

  const setDefaultValue = (value: string, props?: { select?: boolean }) => {
    inputEl.defaultValue = value;
    if (inputEl.defaultValue.length > 0 && props?.select) {
      inputEl.select();
    }
  };

  const setValue = (value: string) => {
    inputEl.value = value;
  };

  const setVisible = (visible: boolean) => {
    inputEl.style.display = visible ? 'block' : 'none';
  };

  const focus = (select?: boolean) => {
    inputEl.focus();
    if (select) {
      inputEl.select();
    }
  };

  const getValue = () => inputEl.value;

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const newValue = inputEl.value.trim();
      if (allowEmpty || newValue.length > 0) {
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

  return { setDefaultValue, setValue, setVisible, focus, getValue, inputEl };
}
