export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-blue-mid border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:from-brand-blue-dark hover:to-brand-blue focus:from-brand-blue-dark focus:to-brand-blue active:brightness-90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 transition ease-in-out duration-150 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
