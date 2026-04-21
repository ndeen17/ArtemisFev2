export default function Button({
  children,
  variant = 'primary',
  as: Tag = 'a',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green';

  const variants = {
    primary:
      'bg-brand-green text-[#111827] ring-4 ring-[#bbf7d0] shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95',
    outline:
      'bg-white text-[#111827] ring-4 ring-[#f1f5f9] border border-[#e5e7eb] hover:bg-gray-50 hover:border-gray-300',
  };

  const sizes = {
    sm: 'px-6 py-2.5 text-[15px]',
    lg: 'px-10 py-4 text-[17px]',
  };

  const size = props.size || 'sm';
  const { size: _omit, ...rest } = props;

  return (
    <Tag className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
