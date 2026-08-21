import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, PieChart, TrendingUp } from 'lucide-react-native';
import { Spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import Button from '../components/ui/Button';

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useAppTheme();
  
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'All Your Money. One Place.',
      description: 'Track your accounts, investments, savings, and financial goals from one unified dashboard.',
      icon: (color: string) => <Building2 size={72} color={color} />,
    },
    {
      title: 'Understand Your Financial Health.',
      description: 'See your financial score, spending patterns, and smart AI insights tailored for Nepal.',
      icon: (color: string) => <PieChart size={72} color={color} />,
    },
    {
      title: 'Invest Smarter. Save Better.',
      description: 'Manage SIP installments, track mutual funds, and achieve your milestone targets.',
      icon: (color: string) => <TrendingUp size={72} color={color} />,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/auth/login');
    }
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  const activeSlide = slides[currentSlide];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skip */}
      <View style={styles.header}>
        {currentSlide < slides.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationContainer}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.accent}15`, borderColor: `${colors.accent}30` }]}>
          {activeSlide.icon(colors.accent)}
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{activeSlide.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{activeSlide.description}</Text>
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
                  backgroundColor: i === currentSlide ? colors.accent : colors.backgroundElement,
                  width: i === currentSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          label={currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
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
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
  },
  skipButton: {
    padding: Spacing.two,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipPlaceholder: {
    height: 38,
  },
  illustrationContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.four * 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.three,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
  footer: {
    paddingHorizontal: Spacing.four * 1.5,
    paddingBottom: Spacing.five,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    alignSelf: 'stretch',
  },
});
