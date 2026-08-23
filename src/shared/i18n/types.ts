import { NAMESPACES, SUPPORTED_LOCALES } from './constants';

export type Namespace = (typeof NAMESPACES)[number];

export type Locale = (typeof SUPPORTED_LOCALES)[number];
