/**
 * WelcomeScreen — Pantalla de bienvenida cuando el chat está vacío.
 * Muestra el emoji del modo, el título y las sugerencias de inicio rápido.
 */
function WelcomeScreen({ mode, suggestions, onSend }) {
  const isAggressive = mode?.id === 'aggressive';

  return (
    <div className="welcome-state">
      <h1 className="welcome-title">
        ¿Qué toca ahora, Pablo?
      </h1>
      <p className="welcome-desc">
        (Soy una inteligencia artificial programada para ayudarte netamente en motivación)
      </p>
    </div>
  );
}

export default WelcomeScreen;
