/**
 * cn - Utility function for conditional class names
 * Alternative to classnames library with TypeScript support
 */

type ClassValue =
    | string
    | number
    | boolean
    | undefined
    | null
    | ClassArray
    | ClassObject;

interface ClassArray extends Array<ClassValue> { }
interface ClassObject extends Record<string, any> { }

/**
 * Utility function to conditionally join class names
 */
export const cn = (...classes: ClassValue[]): string => {
    return classes
        .filter(Boolean)
        .map(cls => {
            if (typeof cls === 'string' || typeof cls === 'number') {
                return String(cls);
            }

            if (Array.isArray(cls)) {
                return cn(...cls);
            }

            if (typeof cls === 'object') {
                return Object.entries(cls)
                    .filter(([, value]) => Boolean(value))
                    .map(([key]) => key)
                    .join(' ');
            }

            return '';
        })
        .filter(Boolean)
        .join(' ');
};

export default cn;