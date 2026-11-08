import { type ComponentProps, useState } from "react";
import { Field } from "../../../components/ui/Field.tsx";

// Password field with the prototype's show/hide eye button.
export function PasswordInput(props: Omit<ComponentProps<typeof Field>, "type" | "suffix">) {
  const [show, setShow] = useState(false);
  return (
    <Field
      {...props}
      type={show ? "text" : "password"}
      suffix={
        <button
          type="button"
          className="border-line text-ink hover:bg-surface-2 rounded-r-[0.6rem] border border-l-0 px-3"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
        >
          <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
        </button>
      }
    />
  );
}
