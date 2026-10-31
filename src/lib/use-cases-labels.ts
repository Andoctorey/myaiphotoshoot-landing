type UseCasesI18n = {
  navigation?: { noUseCases?: string };
  pageCopy?: {
    useCases?: {
      intro?: string;
      metaDescription?: string;
      metaTitle?: string;
      title?: string;
    };
  };
};

export function getUseCasesLabels(messages: unknown) {
  const m = messages as UseCasesI18n;
  return {
    title: m.pageCopy?.useCases?.title || 'AI Photo Use Cases',
    intro: m.pageCopy?.useCases?.intro
      || 'Explore ways to turn your photo into professional headshots, dating profile pictures, avatars, and creative portraits. Browse the guides for example images, prompts, and steps to get started with My AI Photoshoot.',
    metaTitle: m.pageCopy?.useCases?.metaTitle || 'AI Photo Use Cases',
    metaDescription: m.pageCopy?.useCases?.metaDescription
      || 'Explore AI photo use cases for professional headshots, dating profiles, social media, marketing, and creative portraits.',
    emptyLabel: typeof m.navigation?.noUseCases === 'string' ? m.navigation.noUseCases : 'No use cases yet',
  };
}
