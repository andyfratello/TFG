 -- procedemos a borrar las taulas utilizadas para la simulación
  DELETE FROM sch_grafico_recursos
  WHERE codigo_empresa = :global.codigo_empresa
   AND codigo_org_planta = :greport.codigo_org_planta
   AND numero_simulacion = :greport.CODIGO_SIMULACION
   and id_sesion = :parameter.id_sesion;

    DELETE FROM sch_grafico_proyectos
    WHERE codigo_empresa = :global.codigo_empresa
    AND codigo_org_planta = :greport.codigo_org_planta
    AND numero_simulacion = :greport.CODIGO_SIMULACION
    AND ID_SESION = :Parameter.ID_SESION;


  DELETE FROM sch_grafico_carga_recursos
  WHERE codigo_empresa = :global.codigo_empresa
    AND codigo_org_planta = :greport.codigo_org_planta
    AND codigo_simulacion = :greport.CODIGO_SIMULACION
    AND ID_SESION = :Parameter.ID_SESION;

  DELETE FROM sch_recursos
  WHERE ID_SESION = :Parameter.ID_SESION;


    commit;
