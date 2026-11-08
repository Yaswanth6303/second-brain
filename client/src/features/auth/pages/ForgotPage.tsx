import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/Button.tsx";
import { Field } from "../../../components/ui/Field.tsx";
import * as authApi from "../api/auth.ts";
import { AuthLayout, FormAlert, FormHead } from "../components/AuthLayout.tsx";
import { type Errors, apiErrors, forgotSchema, parseForm } from "../schemas.ts";

export function ForgotPage() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { data, errors } = parseForm(forgotSchema, e.currentTarget);
    setErrors(errors);
    if (!data || busy) return;
    setBusy(true);
    try {
      await authApi.forgot(data.email);
      setSent(true);
    } catch (err) {
      setErrors(apiErrors(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <form className="flex flex-col gap-3.5" noValidate onSubmit={onSubmit}>
        <FormHead
          title="Reset your password"
          sub="Enter your email and we will send a reset link."
        />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        {sent && (
          <div
            role="status"
            className="bg-brand-soft text-ink rounded-[10px] px-3 py-2.5 text-[0.9rem]"
          >
            If an account exists for that email, a reset link is on its way. Check the server
            console for the link.
          </div>
        )}
        <FormAlert>{errors.form}</FormAlert>
        <Button type="submit" size="lg" disabled={busy}>
          Send reset link
        </Button>
        <p className="meta mb-0 text-center">
          <Link to="/login" className="linkish">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
