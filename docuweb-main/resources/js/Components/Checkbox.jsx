export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-gray-300 text-brand-blue shadow-sm focus:ring-brand-blue ' +
                className
            }
        />
    );
}
