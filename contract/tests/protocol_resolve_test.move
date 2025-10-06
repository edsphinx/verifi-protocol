#[test_only]
module VeriFiPublisher::protocol_resolve_test {
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::object::{Self, Object};
    use VeriFiPublisher::verifi_protocol::{Self, Market, MarketFactory};
    use VeriFiPublisher::oracle_registry;
    use VeriFiPublisher::access_control;

    // Constantes para la prueba, reflejando las del contrato principal
    const STATUS_RESOLVED_YES: u8 = 2;
    const ORACLE_ID: vector<u8> = b"aptos-balance";
    const TARGET_FUNCTION: vector<u8> = b"balance";
    const OPERATOR_GREATER_THAN: u8 = 0;

    #[test(admin = @0xCAFE)]
    fun test_resolve_market_programmatically_success(admin: &signer) acquires Market, MarketFactory, oracle_registry::OracleRegistry, access_control::AdminStore {
        // --- 1. Inicialización (Setup) ---
        // Se inicializan todos los módulos necesarios como lo haría el script de despliegue.
        access_control::init_module(admin);
        oracle_registry::init_module(admin);
        verifi_protocol::init_module(admin);

        // --- 2. Registrar el Oráculo ---
        // El administrador registra el oráculo 'aptos-balance' para que pueda ser utilizado.
        oracle_registry::register_oracle(
            admin,
            std::string::utf8(ORACLE_ID),
            std::string::utf8(b"Aptos Native Balance")
        );

        // --- 3. Crear el Mercado ---
        // Se crea un mercado que se resolverá en 60 segundos.
        // La condición es que el balance del administrador sea > 0, lo cual siempre será cierto.
        let resolution_time = timestamp::now_seconds() + 60;
        verifi_protocol::create_market(
            admin,
            std::string::utf8(b"Test Market"),
            resolution_time,
            signer::address_of(admin),
            std::string::utf8(ORACLE_ID),
            signer::address_of(admin), // La dirección objetivo es la del admin
            std::string::utf8(TARGET_FUNCTION),
            0, // El valor objetivo es 0
            OPERATOR_GREATER_THAN,
        );

        // --- 4. Obtener la Dirección del Mercado Creado ---
        // Accedemos a la fábrica para obtener el objeto del mercado que acabamos de crear.
        let factory_address = verifi_protocol::get_factory_address();
        let factory = borrow_global<MarketFactory>(factory_address);
        let market_object = *std::vector::borrow(&factory.markets, 0);
        let market_address = object::object_address(&market_object);

        // --- 5. Avanzar el Tiempo ---
        // Simulamos el paso del tiempo para que el mercado esté listo para resolverse.
        timestamp::fast_forward_seconds(61);

        // --- 6. Ejecutar la Función a Probar ---
        // Llamamos a la función de resolución de depuración.
        verifi_protocol::debug_resolve(market_object);

        // --- 7. Verificar el Resultado (Assert) ---
        // Volvemos a acceder al mercado y verificamos que su estado haya cambiado a 'Resuelto a SÍ'.
        // Si el estado no es el esperado, la prueba fallará con un abort.
        let market_after_resolve = borrow_global<Market>(market_address);
        assert!(market_after_resolve.status == STATUS_RESOLVED_YES, 100);
    }
}
