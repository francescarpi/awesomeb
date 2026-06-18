import { describe, it, expect } from 'vitest';
import { acceleratorToDisplay } from './shortcuts';

describe('acceleratorToDisplay', () => {
  describe('macOS (platform="mac")', () => {
    it('renders simple Cmd combination', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+T', 'mac')).toBe('\u2318T');
    });

    it('renders Cmd+Shift combination', () => {
      expect(acceleratorToDisplay('Shift+CmdOrCtrl+T', 'mac')).toBe('\u21E7\u2318T');
    });

    it('renders Cmd+Alt combination', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+Alt+]', 'mac')).toBe('\u2318\u2325]');
    });

    it('renders Cmd+Ctrl combination', () => {
      expect(acceleratorToDisplay('Control+Tab', 'mac')).toBe('\u2303Tab');
    });

    it('renders Cmd+Shift+Alt combination', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+Shift+Alt+C', 'mac')).toBe('\u2318\u21E7\u2325C');
    });

    it('renders arrow keys', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+Left', 'mac')).toBe('\u2318\u2190');
      expect(acceleratorToDisplay('CmdOrCtrl+Right', 'mac')).toBe('\u2318\u2192');
    });

    it('renders Plus key', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+Plus', 'mac')).toBe('\u2318+');
    });

    it('renders minus key', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+-', 'mac')).toBe('\u2318-');
    });

    it('renders comma key', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+,', 'mac')).toBe('\u2318,');
    });

    it('renders standalone Escape', () => {
      expect(acceleratorToDisplay('Escape', 'mac')).toBe('Esc');
    });

    it('renders Cmd+F-key combination', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+F5', 'mac')).toBe('\u2318F5');
    });
  });

  describe('Windows (platform="win")', () => {
    it('renders simple Ctrl combination', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+T', 'win')).toBe('Ctrl+T');
    });

    it('renders Ctrl+Shift combination', () => {
      expect(acceleratorToDisplay('Shift+CmdOrCtrl+T', 'win')).toBe('Shift+Ctrl+T');
    });

    it('renders Ctrl+Alt combination', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+Alt+]', 'win')).toBe('Ctrl+Alt+]');
    });

    it('renders Ctrl+Arrow combination', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+Left', 'win')).toBe('Ctrl+\u2190');
    });

    it('renders Comma key', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+,', 'win')).toBe('Ctrl+,');
    });
  });

  describe('edge cases', () => {
    it('handles bare CmdOrCtrl', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+,', 'win')).toBe('Ctrl+,');
      expect(acceleratorToDisplay('CmdOrCtrl+,', 'mac')).toBe('\u2318,');
    });

    it('handles bare Cmd', () => {
      expect(acceleratorToDisplay('Cmd+C', 'mac')).toBe('\u2318C');
    });

    it('handles bare Ctrl', () => {
      expect(acceleratorToDisplay('Ctrl+C', 'win')).toBe('Ctrl+C');
      expect(acceleratorToDisplay('Ctrl+C', 'mac')).toBe('\u2303C');
    });

    it('handles number keys', () => {
      expect(acceleratorToDisplay('CmdOrCtrl+9', 'mac')).toBe('\u23189');
      expect(acceleratorToDisplay('Shift+CmdOrCtrl+1', 'mac')).toBe('\u21E7\u23181');
    });

    it('returns empty string for empty accelerator', () => {
      expect(acceleratorToDisplay('', 'mac')).toBe('');
      expect(acceleratorToDisplay('', 'win')).toBe('');
    });
  });
});
