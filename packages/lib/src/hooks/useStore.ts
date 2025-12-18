import { useSyncExternalStore } from "react";
import type { createStore } from "../createStore";
import { useShallowSelector } from "./useShallowSelector";

type Store<T> = ReturnType<typeof createStore<T>>;

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useStore = <T, S = T>(store: Store<T>, selector: (state: T) => S = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);

  return useSyncExternalStore(
    store.subscribe,
    () => shallowSelector(store.getState()),
    () => shallowSelector(store.getState()), // getServerSnapshot: 서버에서도 같은 값 사용
  );
};
