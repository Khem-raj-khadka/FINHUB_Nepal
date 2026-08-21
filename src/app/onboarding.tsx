import { useRouter } from "expo-router";
import { useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Button from "../components/ui/Button";
import { Spacing } from "../constants/theme";
import { useAppTheme } from "../hooks/useAppTheme";

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "All Your Money. One Place.",
      description:
        "Track your accounts, investments, savings and financial goals from one dashboard.",
      illustration: "🏦",
    },
    {
      title: "Understand Your Financial Health.",
      description:
        "See your financial score, spending patterns and smart insights.",
      illustration: "📊",
    },
    {
      title: "Invest Smarter. Save Better.",
      description: "Track SIPs, investments and savings goals.",
      illustration: "📈",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push("/auth/login");
    }
  };

  const handleSkip = () => {
    router.push("/auth/login");
  };

  const activeSlide = slides[currentSlide];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Skip */}
      <View style={styles.header}>
        {currentSlide < slides.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationContainer}>
        <Text style={styles.emojiIllustration}>{activeSlide.illustration}</Text>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {activeSlide.title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {activeSlide.description}
        </Text>
      </View>

      {/* Footer controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentSlide
                      ? colors.accent
                      : colors.backgroundSelected,
                  width: i === currentSlide ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          label={currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 50,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.four,
  },
  skipButton: {
    padding: Spacing.two,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  skipPlaceholder: {
    height: 38,
  },
  illustrationContainer: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiIllustration: {
    fontSize: 100,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.four * 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: Spacing.three,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.three,
  },
  footer: {
    paddingHorizontal: Spacing.four * 1.5,
    paddingBottom: Spacing.five,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    alignSelf: "stretch",
  },
});
