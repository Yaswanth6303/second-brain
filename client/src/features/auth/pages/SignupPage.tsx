import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../../components/ui/Button.tsx";
import { Field } from "../../../components/ui/Field.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { useAuth } from "../AuthContext.tsx";
import * as authApi from "../api/auth.ts";
import { AuthLayout, FormAlert, FormHead } from "../components/AuthLayout.tsx";
import { PasswordInput } from "../components/PasswordInput.tsx";
import { StrengthMeter } from "../components/StrengthMeter.tsx";
import { type Errors, apiErrors, parseForm, signupSchema } from "../schemas.ts";

export function SignupPage() {
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { data, errors } = parseForm(signupSchema, e.currentTarget);
    setErrors(errors);
    if (!data) return;
    setBusy(true);
    try {
      const { terms: _terms, ...body } = data;
      const user = await authApi.signup(body);
      setUser(user);
      toast(`Account created. Welcome, ${user.name.split(" ")[0]}.`);
      void navigate("/library", { replace: true });
    } catch (err) {
      setErrors(apiErrors(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout mode="signup">
      <form className="flex flex-col gap-3.5" noValidate onSubmit={onSubmit}>
        <FormHead
          title="Create your account"
          sub="Free for personal use. It takes under a minute."
        />
        <Field label="Full name" name="name" autoComplete="name" error={errors.name} />
        <Field
          label="Username"
          name="handle"
          prefix="@"
          autoComplete="username"
          error={errors.handle}
          hint="Friends use this to find you and send you links."
        />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <div>
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="new-password"
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <StrengthMeter password={password} />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="terms"
              className="check"
              aria-invalid={errors.terms ? true : undefined}
            />
            I agree to the terms and the privacy policy
          </label>
          {errors.terms && <div className="text-danger mt-1 text-[0.875em]">{errors.terms}</div>}
        </div>
        <FormAlert>{errors.form}</FormAlert>
        <Button type="submit" size="lg" disabled={busy}>
          Create account
        </Button>
        <p className="meta mb-0 text-center">
          Already have an account?{" "}
          <Link to="/login" className="linkish">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
