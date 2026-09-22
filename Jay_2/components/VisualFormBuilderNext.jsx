import VisualFormBuilder from './VisualFormBuilder';

/**
 * Builder Lab uses the same editor as Form Builder.
 * Try layout experiments here, on top of this screen, before changing the main builder.
 */
export default function VisualFormBuilderNext({ isStandalone = false, ...props }) {
  return <VisualFormBuilder isStandalone={isStandalone} appearance="lab" {...props} />;
}
