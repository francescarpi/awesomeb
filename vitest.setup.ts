// Set TEST environment before any imports so userDataPath() uses /tmp
process.env.TEST = 'true';

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Text = dom.window.Text;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
