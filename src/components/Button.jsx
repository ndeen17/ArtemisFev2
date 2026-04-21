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
      'bg-brand-green text-[#111827] ring-[2px] ring-[#dcfce7] shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95',
    outline:
      'bg-white text-[#111827] shadow-[0_0_0_2px_rgba(17,24,39,0.04),0_1px_2px_rgba(17,24,39,0.05)] hover:shadow-[0_0_0_2px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.07)]',
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
