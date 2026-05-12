import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

let navigateFn = null;

export const NavigationRegistrar = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigateFn = navigate;
  }, [navigate]);

  return null;
};

export const navigationService = (path, options) => {
  if (navigateFn) {
    navigateFn(path, options);
  } else {
    window.location.href = path;
  }
};
