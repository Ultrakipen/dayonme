// theme/spacing.ts - 모던 스타일 스페이싱 시스템
export const Spacing = {
  // Base spacing unit (4px base)
  unit: 4,
  
  // Spacing scale
  xs: 2,    // 2px
  sm: 4,    // 4px
  md: 8,    // 8px
  lg: 12,   // 12px
  xl: 16,   // 16px
  '2xl': 20,  // 20px
  '3xl': 24,  // 24px
  '4xl': 32,  // 32px
  '5xl': 40,  // 40px
  '6xl': 48,  // 48px
  '7xl': 56,  // 56px
  '8xl': 64,  // 64px
  
  // App-specific spacing
  app: {
    postPadding: 16,      // Padding inside posts
    postMargin: 12,       // Margin between posts
    headerHeight: 56,     // Header height
    tabBarHeight: 60,     // Tab bar height
    iconSize: 24,         // Standard icon size
    profileImageSmall: 32, // Small profile image
    profileImageMedium: 48, // Medium profile image  
    profileImageLarge: 88,  // Large profile image
    buttonHeight: 44,     // Standard button height
    inputHeight: 48,      // Input field height
    cardRadius: 16,       // Card border radius
    buttonRadius: 8,      // Button border radius
    avatarRadius: 24,     // Avatar border radius (half of medium)
  },
  
  // Layout spacing
  layout: {
    screenPadding: 16,    // Screen edge padding
    sectionSpacing: 24,   // Spacing between sections
    componentSpacing: 12, // Spacing between components
    listItemSpacing: 8,   // Spacing between list items
    gridGap: 2,          // Grid gap (like Instagram photo grid)
  },
  
  // Component-specific spacing
  components: {
    // Post spacing
    post: {
      headerPadding: 12,
      contentPadding: 12,
      actionsPadding: 8,
      commentsMargin: 4,
    },
    
    // Story spacing
    story: {
      containerPadding: 8,
      itemMargin: 4,
      imageSize: 64,
    },
    
    // Profile spacing
    profile: {
      headerPadding: 16,
      statsPadding: 20,
      bioMargin: 8,
    },
    
    // Form spacing
    form: {
      fieldSpacing: 16,
      buttonMargin: 20,
      labelMargin: 4,
    },
  },
};

// Helper functions for spacing
export const getSpacing = (multiplier: number): number => Spacing.unit * multiplier;

type SpacingKey = keyof typeof Spacing;

export const createSpacing = {
  // Margin helpers
  m: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { margin: spacingValue } : {};
  },
  mt: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { marginTop: spacingValue } : {};
  },
  mr: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { marginRight: spacingValue } : {};
  },
  mb: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { marginBottom: spacingValue } : {};
  },
  ml: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { marginLeft: spacingValue } : {};
  },
  mx: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? {
      marginLeft: spacingValue,
      marginRight: spacingValue
    } : {};
  },
  my: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? {
      marginTop: spacingValue,
      marginBottom: spacingValue
    } : {};
  },

  // Padding helpers
  p: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { padding: spacingValue } : {};
  },
  pt: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { paddingTop: spacingValue } : {};
  },
  pr: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { paddingRight: spacingValue } : {};
  },
  pb: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { paddingBottom: spacingValue } : {};
  },
  pl: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? { paddingLeft: spacingValue } : {};
  },
  px: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? {
      paddingLeft: spacingValue,
      paddingRight: spacingValue
    } : {};
  },
  py: (value: SpacingKey) => {
    const spacingValue = Spacing[value];
    return spacingValue !== undefined ? {
      paddingTop: spacingValue,
      paddingBottom: spacingValue
    } : {};
  },
};