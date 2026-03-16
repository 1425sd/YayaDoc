"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./animated-characters-login-page.module.css";

const brandIconSrc = "/icons/app-icon-512x512.png";
const brandWordmarkSrc = "/brand-wordmark.svg";

interface PupilProps {
  mouseX: number;
  mouseY: number;
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

interface EyeBallProps extends PupilProps {
  eyeColor?: string;
  isBlinking?: boolean;
  pupilSize?: number;
  size?: number;
}

interface AnimatedCharactersAuthPageProps {
  authError?: string;
  bottomHref?: string;
  bottomLabel?: string;
  bottomText?: string;
  brandName: string;
  email: string;
  emailError?: ReactNode;
  confirmPassword?: string;
  confirmPasswordError?: ReactNode;
  enforceSso?: boolean;
  forgotPasswordHref?: string;
  isLoading?: boolean;
  mode: "login" | "register";
  name?: string;
  nameError?: ReactNode;
  onConfirmPasswordBlur?: () => void;
  onConfirmPasswordChange?: (value: string) => void;
  onEmailBlur?: () => void;
  onEmailChange: (value: string) => void;
  onNameBlur?: () => void;
  onNameChange?: (value: string) => void;
  onPasswordBlur?: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
  passwordError?: ReactNode;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  socialLogin?: ReactNode;
}

interface BrandLockupProps {
  brandName: string;
  className?: string;
}

function getTrackedPosition(
  ref: RefObject<HTMLDivElement | null>,
  mouseX: number,
  mouseY: number,
  maxDistance: number,
  forceLookX?: number,
  forceLookY?: number,
) {
  if (!ref.current) {
    return { x: 0, y: 0 };
  }

  if (forceLookX !== undefined && forceLookY !== undefined) {
    return { x: forceLookX, y: forceLookY };
  }

  const rect = ref.current.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = mouseX - centerX;
  const deltaY = mouseY - centerY;
  const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
  const angle = Math.atan2(deltaY, deltaX);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

function Pupil({
  mouseX,
  mouseY,
  size = 12,
  maxDistance = 5,
  pupilColor = "#2d2d2d",
  forceLookX,
  forceLookY,
}: PupilProps) {
  const pupilRef = useRef<HTMLDivElement | null>(null);
  const position = getTrackedPosition(
    pupilRef,
    mouseX,
    mouseY,
    maxDistance,
    forceLookX,
    forceLookY,
  );

  return (
    <div
      ref={pupilRef}
      className={classes.pupil}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    />
  );
}

function EyeBall({
  mouseX,
  mouseY,
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "#ffffff",
  pupilColor = "#2d2d2d",
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const eyeRef = useRef<HTMLDivElement | null>(null);
  const position = getTrackedPosition(
    eyeRef,
    mouseX,
    mouseY,
    maxDistance,
    forceLookX,
    forceLookY,
  );

  return (
    <div
      ref={eyeRef}
      className={classes.eyeball}
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
      }}
    >
      {!isBlinking && (
        <div
          className={classes.pupil}
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
      )}
    </div>
  );
}

function useRandomBlink() {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkStartTimeoutId = 0;
    let blinkEndTimeoutId = 0;

    const scheduleBlink = () => {
      blinkStartTimeoutId = window.setTimeout(
        () => {
          setIsBlinking(true);
          blinkEndTimeoutId = window.setTimeout(() => {
            setIsBlinking(false);
            scheduleBlink();
          }, 150);
        },
        Math.random() * 4000 + 3000,
      );
    };

    scheduleBlink();

    return () => {
      window.clearTimeout(blinkStartTimeoutId);
      window.clearTimeout(blinkEndTimeoutId);
    };
  }, []);

  return isBlinking;
}

function BrandLockup({ brandName, className }: BrandLockupProps) {
  return (
    <div className={clsx(classes.brand, className)}>
      <img
        src={brandIconSrc}
        alt=""
        aria-hidden="true"
        className={classes.brandIcon}
      />
      <img
        src={brandWordmarkSrc}
        alt={brandName}
        className={classes.brandWordmark}
      />
    </div>
  );
}

export function AnimatedCharactersAuthPage({
  authError,
  bottomHref,
  bottomLabel,
  bottomText,
  brandName,
  confirmPassword = "",
  confirmPasswordError,
  email,
  emailError,
  enforceSso = false,
  forgotPasswordHref,
  isLoading = false,
  mode,
  name = "",
  nameError,
  onConfirmPasswordBlur,
  onConfirmPasswordChange,
  onEmailBlur,
  onEmailChange,
  onNameBlur,
  onNameChange,
  onPasswordBlur,
  onPasswordChange,
  onSubmit,
  password,
  passwordError,
  secondaryActionHref,
  secondaryActionLabel,
  socialLogin,
}: AnimatedCharactersAuthPageProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement | null>(null);
  const blackRef = useRef<HTMLDivElement | null>(null);
  const yellowRef = useRef<HTMLDivElement | null>(null);
  const orangeRef = useRef<HTMLDivElement | null>(null);
  const isPurpleBlinking = useRandomBlink();
  const isBlackBlinking = useRandomBlink();
  const isRegisterMode = mode === "register";
  const hasPasswordValue =
    password.length > 0 || (confirmPassword?.length ?? 0) > 0;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false);
      return;
    }

    setIsLookingAtEachOther(true);
    const timerId = window.setTimeout(() => {
      setIsLookingAtEachOther(false);
    }, 800);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isTyping]);

  useEffect(() => {
    if (!(hasPasswordValue && showPassword)) {
      setIsPurplePeeking(false);
      return;
    }

    let peekStartTimeoutId = 0;
    let peekEndTimeoutId = 0;

    const schedulePeek = () => {
      peekStartTimeoutId = window.setTimeout(
        () => {
          setIsPurplePeeking(true);
          peekEndTimeoutId = window.setTimeout(() => {
            setIsPurplePeeking(false);
            schedulePeek();
          }, 800);
        },
        Math.random() * 3000 + 2000,
      );
    };

    schedulePeek();

    return () => {
      window.clearTimeout(peekStartTimeoutId);
      window.clearTimeout(peekEndTimeoutId);
    };
  }, [confirmPassword?.length, hasPasswordValue, showPassword]);

  const calculatePosition = (ref: RefObject<HTMLDivElement | null>) => {
    if (!ref.current) {
      return { bodySkew: 0, faceX: 0, faceY: 0 };
    }

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
    };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const showPasswordReaction = hasPasswordValue && showPassword;
  const hidePasswordReaction = hasPasswordValue && !showPassword;
  const submitLabel = isRegisterMode ? t("Sign Up") : t("Sign In");
  const submitLoadingLabel = isRegisterMode
    ? t("Creating account...")
    : t("Signing in...");

  return (
    <div className={classes.root}>
      <section className={classes.hero}>
        <div className={classes.heroContent}>
          <BrandLockup brandName={brandName} />
        </div>

        <div className={classes.charactersWrap} aria-hidden="true">
          <div className={classes.charactersStage}>
            <div
              ref={purpleRef}
              className={clsx(classes.character, classes.purpleCharacter)}
              style={{
                height: isTyping || hidePasswordReaction ? "440px" : "400px",
                transform: showPasswordReaction
                  ? "skewX(0deg)"
                  : isTyping || hidePasswordReaction
                    ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
                    : `skewX(${purplePos.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className={clsx(classes.eyes, classes.purpleEyes)}
                style={{
                  left: showPasswordReaction
                    ? "20px"
                    : isLookingAtEachOther
                      ? "55px"
                      : `${45 + purplePos.faceX}px`,
                  top: showPasswordReaction
                    ? "35px"
                    : isLookingAtEachOther
                      ? "65px"
                      : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  isBlinking={isPurpleBlinking}
                  forceLookX={
                    showPasswordReaction
                      ? isPurplePeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                        ? 3
                        : undefined
                  }
                  forceLookY={
                    showPasswordReaction
                      ? isPurplePeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                        ? 4
                        : undefined
                  }
                />
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  isBlinking={isPurpleBlinking}
                  forceLookX={
                    showPasswordReaction
                      ? isPurplePeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                        ? 3
                        : undefined
                  }
                  forceLookY={
                    showPasswordReaction
                      ? isPurplePeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                        ? 4
                        : undefined
                  }
                />
              </div>
            </div>

            <div
              ref={blackRef}
              className={clsx(classes.character, classes.blackCharacter)}
              style={{
                transform: showPasswordReaction
                  ? "skewX(0deg)"
                  : isLookingAtEachOther
                    ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
                    : isTyping || hidePasswordReaction
                      ? `skewX(${blackPos.bodySkew * 1.5}deg)`
                      : `skewX(${blackPos.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className={clsx(classes.eyes, classes.blackEyes)}
                style={{
                  left: showPasswordReaction
                    ? "10px"
                    : isLookingAtEachOther
                      ? "32px"
                      : `${26 + blackPos.faceX}px`,
                  top: showPasswordReaction
                    ? "28px"
                    : isLookingAtEachOther
                      ? "12px"
                      : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  isBlinking={isBlackBlinking}
                  forceLookX={
                    showPasswordReaction
                      ? -4
                      : isLookingAtEachOther
                        ? 0
                        : undefined
                  }
                  forceLookY={
                    showPasswordReaction
                      ? -4
                      : isLookingAtEachOther
                        ? -4
                        : undefined
                  }
                />
                <EyeBall
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  isBlinking={isBlackBlinking}
                  forceLookX={
                    showPasswordReaction
                      ? -4
                      : isLookingAtEachOther
                        ? 0
                        : undefined
                  }
                  forceLookY={
                    showPasswordReaction
                      ? -4
                      : isLookingAtEachOther
                        ? -4
                        : undefined
                  }
                />
              </div>
            </div>

            <div
              ref={orangeRef}
              className={clsx(classes.character, classes.orangeCharacter)}
              style={{
                transform: showPasswordReaction
                  ? "skewX(0deg)"
                  : `skewX(${orangePos.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className={clsx(classes.eyesFast, classes.orangeEyes)}
                style={{
                  left: showPasswordReaction
                    ? "50px"
                    : `${82 + orangePos.faceX}px`,
                  top: showPasswordReaction
                    ? "85px"
                    : `${90 + orangePos.faceY}px`,
                }}
              >
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  forceLookX={showPasswordReaction ? -5 : undefined}
                  forceLookY={showPasswordReaction ? -4 : undefined}
                />
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  forceLookX={showPasswordReaction ? -5 : undefined}
                  forceLookY={showPasswordReaction ? -4 : undefined}
                />
              </div>
            </div>

            <div
              ref={yellowRef}
              className={clsx(classes.character, classes.yellowCharacter)}
              style={{
                transform: showPasswordReaction
                  ? "skewX(0deg)"
                  : `skewX(${yellowPos.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className={clsx(classes.eyesFast, classes.yellowEyes)}
                style={{
                  left: showPasswordReaction
                    ? "20px"
                    : `${52 + yellowPos.faceX}px`,
                  top: showPasswordReaction
                    ? "35px"
                    : `${40 + yellowPos.faceY}px`,
                }}
              >
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  forceLookX={showPasswordReaction ? -5 : undefined}
                  forceLookY={showPasswordReaction ? -4 : undefined}
                />
                <Pupil
                  mouseX={mouseX}
                  mouseY={mouseY}
                  size={12}
                  maxDistance={5}
                  forceLookX={showPasswordReaction ? -5 : undefined}
                  forceLookY={showPasswordReaction ? -4 : undefined}
                />
              </div>

              <div
                className={classes.yellowMouth}
                style={{
                  left: showPasswordReaction
                    ? "10px"
                    : `${40 + yellowPos.faceX}px`,
                  top: showPasswordReaction
                    ? "88px"
                    : `${88 + yellowPos.faceY}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className={classes.heroFooter}>
          <span className={classes.heroFooterText}>Privacy Policy</span>
          <span className={classes.heroFooterText}>Terms of Service</span>
          <span className={classes.heroFooterText}>Contact</span>
        </div>

        <div className={classes.heroGrid} />
        <div className={classes.heroGlowTop} />
        <div className={classes.heroGlowBottom} />
      </section>

      <section className={classes.panel}>
        <div className={classes.panelInner}>
          <BrandLockup brandName={brandName} className={classes.mobileBrand} />

          <header className={classes.header}>
            <h1 className={classes.title}>
              {isRegisterMode
                ? t("Create your account")
                : t("Welcome YayaDoc")}
            </h1>
            <p className={classes.subtitle}>
              {isRegisterMode
                ? t("Create an account to access your workspace.")
                : t("Please enter your details")}
            </p>
          </header>

          {!enforceSso ? (
            <form className={classes.form} onSubmit={onSubmit}>
              {isRegisterMode && (
                <div className={classes.field}>
                  <label className={classes.label} htmlFor="name">
                    {t("Display name")}
                  </label>
                  <div className={classes.inputWrap}>
                    <input
                      id="name"
                      className={clsx(
                        classes.input,
                        nameError && classes.inputError,
                      )}
                      type="text"
                      placeholder={t("How should we call you?")}
                      value={name}
                      autoComplete="nickname"
                      disabled={isLoading}
                      onBlur={() => {
                        setIsTyping(false);
                        onNameBlur?.();
                      }}
                      onChange={(event) => onNameChange?.(event.target.value)}
                      onFocus={() => setIsTyping(true)}
                    />
                  </div>
                  {nameError && (
                    <div className={classes.fieldError}>{nameError}</div>
                  )}
                </div>
              )}

              <div className={classes.field}>
                <label className={classes.label} htmlFor="email">
                  {t("Email")}
                </label>
                <div className={classes.inputWrap}>
                  <input
                    id="email"
                    className={clsx(
                      classes.input,
                      emailError && classes.inputError,
                    )}
                    type="email"
                    placeholder="anna@gmail.com"
                    value={email}
                    autoComplete="username"
                    disabled={isLoading}
                    onBlur={() => {
                      setIsTyping(false);
                      onEmailBlur?.();
                    }}
                    onChange={(event) => onEmailChange(event.target.value)}
                    onFocus={() => setIsTyping(true)}
                    required
                  />
                </div>
                {emailError && (
                  <div className={classes.fieldError}>{emailError}</div>
                )}
              </div>

              <div className={classes.field}>
                <label className={classes.label} htmlFor="password">
                  {t("Password")}
                </label>
                <div className={classes.inputWrap}>
                  <input
                    id="password"
                    className={clsx(
                      classes.input,
                      classes.passwordInput,
                      passwordError && classes.inputError,
                    )}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    autoComplete={
                      isRegisterMode ? "new-password" : "current-password"
                    }
                    disabled={isLoading}
                    onBlur={onPasswordBlur}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={classes.toggleButton}
                    aria-label={
                      showPassword
                        ? t("Hide password")
                        : t("Show password")
                    }
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? (
                      <IconEyeOff size={18} />
                    ) : (
                      <IconEye size={18} />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <div className={classes.fieldError}>{passwordError}</div>
                )}
              </div>

              {isRegisterMode && (
                <div className={classes.field}>
                  <label className={classes.label} htmlFor="confirmPassword">
                    {t("Confirm password")}
                  </label>
                  <div className={classes.inputWrap}>
                    <input
                      id="confirmPassword"
                      className={clsx(
                        classes.input,
                        classes.passwordInput,
                        confirmPasswordError && classes.inputError,
                      )}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      autoComplete="new-password"
                      disabled={isLoading}
                      onBlur={onConfirmPasswordBlur}
                      onChange={(event) =>
                        onConfirmPasswordChange?.(event.target.value)
                      }
                      required
                    />
                    <button
                      type="button"
                      className={classes.toggleButton}
                      aria-label={
                        showPassword
                          ? t("Hide password")
                          : t("Show password")
                      }
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? (
                        <IconEyeOff size={18} />
                      ) : (
                        <IconEye size={18} />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <div className={classes.fieldError}>
                      {confirmPasswordError}
                    </div>
                  )}
                </div>
              )}

              {!isRegisterMode && forgotPasswordHref && (
                <div className={classes.helperRow}>
                  <label className={classes.remember} htmlFor="remember">
                    <input
                      id="remember"
                      type="checkbox"
                      className={classes.checkbox}
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span className={classes.rememberLabel}>
                      {t("Remember for 30 days")}
                    </span>
                  </label>

                  <Link className={classes.forgotLink} to={forgotPasswordHref}>
                    {t("Forgot password?")}
                  </Link>
                </div>
              )}

              {authError && (
                <div className={classes.errorBanner}>{authError}</div>
              )}

              <button
                type="submit"
                className={classes.submitButton}
                disabled={isLoading}
              >
                {isLoading ? submitLoadingLabel : submitLabel}
              </button>

              {secondaryActionHref && secondaryActionLabel && (
                <Link className={classes.secondaryButton} to={secondaryActionHref}>
                  {secondaryActionLabel}
                </Link>
              )}
            </form>
          ) : (
            <div className={classes.enforceSsoCard}>
              <p className={classes.enforceSsoTitle}>{t("Single sign-on is required")}</p>
              <p className={classes.enforceSsoText}>
                {t("Use one of the available identity providers below to continue.")}
              </p>
            </div>
          )}

          {socialLogin && (
            <div className={classes.socialLogin}>{socialLogin}</div>
          )}

          {bottomText && bottomLabel && bottomHref && (
            <div className={classes.bottomText}>
              {bottomText}{" "}
              <Link className={classes.bottomLink} to={bottomHref}>
                {bottomLabel}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
