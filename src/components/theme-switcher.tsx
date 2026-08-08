import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  applyTheme,
  readStoredTheme,
  saveTheme,
  themeChangeEvent,
  themeStorageKey,
  type Theme,
} from "@/lib/theme";
import {
  readSpiderManAudioState,
  spiderManAudioStateChangeEvent,
  toggleSpiderManAudio,
  type SpiderManAudioState,
} from "@/lib/spider-man-audio";
import {
  BugIcon,
  CheckIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import {
  useEffect,
  useState,
  type AriaAttributes,
  type ComponentType,
} from "react";

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: AriaAttributes["aria-hidden"];
  }>;
}

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Sáng",
    description: "Nền sáng, độ tương phản quen thuộc.",
    icon: SunIcon,
  },
  {
    value: "dark",
    label: "Tối",
    description: "Dịu mắt hơn trong môi trường thiếu sáng.",
    icon: MoonIcon,
  },
  {
    value: "spider-man",
    label: "Spider-Man",
    description: "Đỏ anh hùng trên nền xanh đêm.",
    icon: BugIcon,
  },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState(readStoredTheme);
  const [audioState, setAudioState] = useState(readSpiderManAudioState);
  const [open, setOpen] = useState(false);
  const activeTheme =
    themeOptions.find((option) => option.value === theme) ?? themeOptions[0];
  const ActiveIcon = activeTheme.icon;

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      setTheme((event as CustomEvent<Theme>).detail);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== themeStorageKey) return;
      const storedTheme = readStoredTheme();
      applyTheme(storedTheme);
      setTheme(storedTheme);
    };
    const onAudioStateChange = (event: Event) => {
      setAudioState(
        (event as CustomEvent<SpiderManAudioState>).detail,
      );
    };

    window.addEventListener(themeChangeEvent, onThemeChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener(
      spiderManAudioStateChangeEvent,
      onAudioStateChange,
    );
    return () => {
      window.removeEventListener(themeChangeEvent, onThemeChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        spiderManAudioStateChangeEvent,
        onAudioStateChange,
      );
    };
  }, []);

  const selectTheme = (nextTheme: Theme) => {
    saveTheme(nextTheme);
    setOpen(false);
  };

  const audioOff = audioState.muted || !audioState.playing;
  const AudioIcon = audioOff ? VolumeXIcon : Volume2Icon;

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`Đổi giao diện. Hiện tại: ${activeTheme.label}`}
              title={`Giao diện: ${activeTheme.label}`}
            >
              <ActiveIcon aria-hidden="true" />
            </Button>
          }
        />

        <PopoverContent align="end" className="w-64 p-1.5">
          <PopoverHeader className="px-1.5 py-1">
            <PopoverTitle className="flex items-center gap-1.5 text-xs">
              <PaletteIcon className="size-3.5" aria-hidden="true" />
              Giao diện
            </PopoverTitle>
            <PopoverDescription>
              Lựa chọn được lưu trên trình duyệt này.
            </PopoverDescription>
          </PopoverHeader>

          <div role="group" aria-label="Chọn giao diện" className="space-y-0.5">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const selected = theme === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  variant={selected ? "secondary" : "ghost"}
                  size="sm"
                  className="h-auto w-full justify-start gap-2 px-1.5 py-1.5 text-left"
                  onClick={() => selectTheme(option.value)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{option.label}</span>
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  {selected && (
                    <CheckIcon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {theme === "spider-man" && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={
            audioOff
              ? "Bật âm thanh Spider-Man"
              : "Tắt âm thanh Spider-Man"
          }
          aria-pressed={audioOff}
          title={
            audioOff
              ? "Bật âm thanh Spider-Man"
              : "Tắt âm thanh Spider-Man"
          }
          className={
            audioState.playing && !audioOff ? "text-primary" : undefined
          }
          onClick={toggleSpiderManAudio}
        >
          <AudioIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
