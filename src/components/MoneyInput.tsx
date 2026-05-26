import { useEffect, useState } from "react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  showPrefix?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
};

const fmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatFromCents(cents: number, showPrefix: boolean) {
  const v = fmt.format(cents / 100);
  return showPrefix ? `R$ ${v}` : v;
}

/**
 * Input de valor monetário em padrão BR (R$ 1.234,56).
 * Formata em tempo real conforme o usuário digita.
 * Trabalha internamente em centavos para evitar imprecisões de float.
 */
export function MoneyInput({
  value,
  onChange,
  className = "",
  placeholder,
  showPrefix = true,
  id,
  name,
  disabled,
}: Props) {
  const [display, setDisplay] = useState(() =>
    formatFromCents(Math.round((value || 0) * 100), showPrefix)
  );

  useEffect(() => {
    const cents = Math.round((value || 0) * 100);
    const next = formatFromCents(cents, showPrefix);
    setDisplay((cur) => {
      const curCents = Math.round((parseDigits(cur) || 0));
      return curCents === cents ? cur : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, showPrefix]);

  function parseDigits(s: string) {
    const d = s.replace(/\D/g, "");
    return d ? parseInt(d, 10) : 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cents = parseDigits(e.target.value);
    setDisplay(formatFromCents(cents, showPrefix));
    onChange(cents / 100);
  }

  return (
    <input
      id={id}
      name={name}
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      placeholder={placeholder ?? (showPrefix ? "R$ 0,00" : "0,00")}
      value={display}
      onChange={handleChange}
      className={className}
    />
  );
}

export default MoneyInput;
