<?php

function controller( $args ) {

  if(carga_sesion()) {

    switch( $args[0] ) {

      case 'carga_erp':
        $foo = carga_erp();
        break;

      case 'get_data':
        $foo = get_data();
        break;

      case 'actualizar_datos_tarea':
        $foo = actualizar_datos_tarea();
        break;

      case 'actualizar_datos_tarea_con_fecha_fin':
        $foo = actualizar_datos_tarea_con_fecha_fin();
        break;

      case 'es_simulacion_en_uso':
        $foo = es_simulacion_en_uso();
        break;

      case 'rehacer_tablas':
        $foo = rehacer_tablas();
        break;

      case 'guardar_datos_grafico':
        $foo = guardar_datos_grafico();
        break;

      case 'get_hora_turno':
        $foo = get_hora_turno();
        break;

      case 'get_dias_semana_turno':
        $foo = get_dias_semana_turno();
        break;

      case 'devuelve_fecha_fin_calendario':
        $foo = devuelve_fecha_fin_calendario();
        break;

      case 'devuelve_fechas_iniciales':
        $foo = devuelve_fechas_iniciales();
        break;

      case 'actualizar_fecha_fin':
        $foo = actualizar_fecha_fin();
        break;

      case 'numero_secuencias_of':
        $foo = numero_secuencias_of();
        break;
      
      case 'get_fechas_secuencia':
        $foo = get_fechas_secuencia();
        break;
  
      default:
        $foo = '"resultado":"NO_OK","mensaje":"No se ha definido el controlador"';

    }

  }

  return $foo;

}


function carga_erp() {

  $cnx = sql_connect();

  $mwl = $_SESSION[_DEF_SESSION_NAME];

  $modulo = 'p_ccmaqs';

  $out = load_erp($modulo, $cnx);

  $menu = $_SESSION[_DEF_SESSION_NAME.'-'.$GLOBALS['modulo']]['menu'];
  $pass = ($menu['password'] == '') ? 'N' : 'S';
  $out .= '"password": "'.$pass.'",';

  $out .= '"resultado": "OK"';

  return $out;

}


function get_data() {
  $cnx = sql_connect();
  session_write_close();
  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $fecha_fin_prevista = $_POST['fecha_fin_prevista'];
  $fecha_ini_prevista = $_POST['fecha_ini_prevista'];

  $out = '';
  $links = '';
  $linkID = 1;

  // Execute the PL/SQL Function for Tasks
  $sqlTasks = "SELECT id_sesion, numero_simulacion, codigo_org_planta, orden_de_fabricacion, secuencia, fase, linea, tipo, fecha_ini, fecha_fin, recurso, desc_recurso, porc_completado, y, nexttask, nextrecurso, recurso_libra FROM TABLE(pk_web_p_ccmaqs_xe.get_ofs_graph(:numero_simulacion, :codigo_org_planta, :fecha_fin_prevista, :fecha_ini_prevista))";
  $exec = oci_parse($cnx, $sqlTasks);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":fecha_fin_prevista", $fecha_fin_prevista, 100);
  oci_bind_by_name($exec, ":fecha_ini_prevista", $fecha_ini_prevista, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"tareas":{';
  $out .= '"data":[';
  $rc = false;

  while ($row = oci_fetch_assoc($exec)) {
    $porcentaje = $row['PORC_COMPLETADO']/100;
    //$idMasUno = $row['Y'] + 1;
    $out .= '{"id":' . $row['Y'] . ',"text":"' . $row['ORDEN_DE_FABRICACION'] . '/' . $row['SECUENCIA'] . '","type": "task","start_date":"' . $row['FECHA_INI'] . '","end_date":"' . $row['FECHA_FIN'] . '","progress":' . $porcentaje . ',"readonly": false,"owner": [{"resource_id": "' . $row['RECURSO_LIBRA'] . '", "value": 2}]},';
    // links entre tareas
    if ($row['NEXTTASK'] != -1) {
      $links .= '{"id":' . $linkID . ',"source":' . $row['Y'] . ',"target":' . $row['NEXTTASK'] . ',"type":"0"},';
      $linkID++;
    }
  }

  $out = rtrim($out, ',');
  $links = rtrim($links, ',');

  $out .= '],"links": [';
  $out .= $links;
  $out .= ']},';

  oci_free_statement($exec);

  // Execute the PL/SQL Function for Resources
  $sqlResources = "SELECT recurso_libra, desc_recurso FROM TABLE(pk_web_p_ccmaqs_xe.get_recursos_graph(:numero_simulacion, :codigo_org_planta))";
  $execResources = oci_parse($cnx, $sqlResources);
  oci_bind_by_name($execResources, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($execResources, ":numero_simulacion", $numero_simulacion, 100);

  if (!oci_execute($execResources)) return oci_execute_error($execResources);

  $out .= '"recursos":[';
  $rc = false;

  while ($row = oci_fetch_assoc($execResources)) {
    $out .= '{"id": "' . $row['RECURSO_LIBRA'] . '","text": "' . $row['DESC_RECURSO'] . '"},';
  }

  $out = rtrim($out, ',');
  $out .= ']';

  oci_free_statement($execResources);
  oci_close($cnx);

  return $out;
}


function actualizar_datos_tarea() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $planta = $_POST['planta'];
  $simulacion = $_POST['simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];
  $secuencia = $_POST['secuencia'];
  $fecha_inicio = $_POST['fecha_inicio'];

  $out = '';
  $result = '';

  // Execute the PL/SQL Function for Tasks
  //$sql = "BEGIN :result := pk_web_p_ccmaqs_xe.actualizar_datos_tarea(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia, :fecha_inicio, :cambio_recurso, :desde_proyecto, :hasta_proyecto, :desde_maquina, :hasta_maquina, :desde_of, :hasta_of, :desde_fecha_aux, :hasta_fecha_aux, :desde_seccion, :hasta_seccion, :desde_tipo_maquina, :hasta_tipo_maquina, :recalcular_al_mover); END;";
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.actualizar_datos_tarea(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia, :fecha_inicio); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":planta", $planta, 100);
  oci_bind_by_name($exec, ":simulacion", $simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":secuencia", $secuencia, 100);
  oci_bind_by_name($exec, ":fecha_inicio", $fecha_inicio, 100);

  oci_bind_by_name($exec, ":result", $result, 100);

  if (!oci_execute($exec)) {
    return oci_execute_error($exec);
  }

  $out = '"resultado":"OK","fecha_fin":"' . $result . '"';
  // $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function actualizar_datos_tarea_con_fecha_fin() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $planta = $_POST['planta'];
  $simulacion = $_POST['simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];
  $secuencia = $_POST['secuencia'];
  $fecha_inicio = $_POST['fecha_inicio'];
  $fecha_fin = $_POST['fecha_fin'];

  $out = '';
  $result = '';

  // Execute the PL/SQL Function for Tasks
  //$sql = "BEGIN :result := pk_web_p_ccmaqs_xe.actualizar_datos_tarea(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia, :fecha_inicio, :cambio_recurso, :desde_proyecto, :hasta_proyecto, :desde_maquina, :hasta_maquina, :desde_of, :hasta_of, :desde_fecha_aux, :hasta_fecha_aux, :desde_seccion, :hasta_seccion, :desde_tipo_maquina, :hasta_tipo_maquina, :recalcular_al_mover); END;";
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.actualizar_datos_tarea_con_fecha_fin(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia, :fecha_inicio, :fecha_fin); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":planta", $planta, 100);
  oci_bind_by_name($exec, ":simulacion", $simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":secuencia", $secuencia, 100);
  oci_bind_by_name($exec, ":fecha_inicio", $fecha_inicio, 100);
  oci_bind_by_name($exec, ":fecha_fin", $fecha_fin, 100);

  oci_bind_by_name($exec, ":result", $result, 100);

  if (!oci_execute($exec)) {
    return oci_execute_error($exec);
  }

  $out = '"resultado":"OK","fecha_fin":"' . $result . '"';
  // $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function es_simulacion_en_uso() {
  $cnx = sql_connect();
  session_write_close();

  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];

  $out = '';

  $result = 0;

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.es_simulacion_en_uso(:empresa, :codigo_org_planta, :numero_simulacion); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":result", $result, SQLT_INT);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function rehacer_tablas() {
  $cnx = sql_connect();
  session_write_close();

  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $hasta_proyecto = $_POST['hasta_proyecto'];
  $desde_proyecto = $_POST['desde_proyecto'];
  $hasta_maquina = $_POST['hasta_maquina'];
  $desde_maquina = $_POST['desde_maquina'];
  $hasta_orden_fabricacion = $_POST['hasta_orden_fabricacion'];
  $desde_orden_fabricacion = $_POST['desde_orden_fabricacion'];
  //$fecha_fin_prevista = $_POST['fecha_fin_prevista'];
  //$fecha_ini_prevista = $_POST['fecha_ini_prevista'];
  $desde_seccion = $_POST['desde_seccion'];
  $hasta_seccion = $_POST['hasta_seccion'];
  $desde_tipo_maquina = $_POST['desde_tipo_maquina'];
  $hasta_tipo_maquina = $_POST['hasta_tipo_maquina'];

  $out = '';

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN pk_web_p_ccmaqs_xe.rehacer_tablas(:numero_simulacion, :codigo_org_planta, :empresa, :hasta_proyecto, :desde_proyecto, :hasta_maquina, :desde_maquina, :hasta_orden_fabricacion, :desde_orden_fabricacion, :desde_seccion, :hasta_seccion, :desde_tipo_maquina, :hasta_tipo_maquina); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":hasta_proyecto", $hasta_proyecto, 100);
  oci_bind_by_name($exec, ":desde_proyecto", $desde_proyecto, 100);
  oci_bind_by_name($exec, ":hasta_maquina", $hasta_maquina, 100);
  oci_bind_by_name($exec, ":desde_maquina", $desde_maquina, 100);
  oci_bind_by_name($exec, ":hasta_orden_fabricacion", $hasta_orden_fabricacion, 100);
  oci_bind_by_name($exec, ":desde_orden_fabricacion", $desde_orden_fabricacion, 100);
  //oci_bind_by_name($exec, ":fecha_fin_prevista", $fecha_fin_prevista, 100);
  //oci_bind_by_name($exec, ":fecha_ini_prevista", $fecha_ini_prevista, 100);
  oci_bind_by_name($exec, ":desde_seccion", $desde_seccion, 100);
  oci_bind_by_name($exec, ":hasta_seccion", $hasta_seccion, 100);
  oci_bind_by_name($exec, ":desde_tipo_maquina", $desde_tipo_maquina, 100);
  oci_bind_by_name($exec, ":hasta_tipo_maquina", $hasta_tipo_maquina, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"OK"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function guardar_datos_grafico() {
  $cnx = sql_connect();
  session_write_close();

  $out = '';

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN pk_web_p_ccmaqs_xe.guardar_datos_grafico(); END;";
  $exec = oci_parse($cnx, $sql);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"OK"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function get_hora_turno() {
  $cnx = sql_connect();
  session_write_close();

  $codigo_org_planta = $_POST['codigo_org_planta'];
  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];

  $out = '';
  $result = '';

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.get_hora_turno(:codigo_org_planta, :empresa); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":result", $result, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function get_dias_semana_turno() {
  $cnx = sql_connect();
  session_write_close();

  $codigo_org_planta = $_POST['codigo_org_planta'];
  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];

  $out = '';
  $result = '';

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.get_dias_semana_turno(:empresa, :codigo_org_planta); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":result", $result, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}

//interna
function devuelve_fecha_fin_calendario() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];
  $secuencia = $_POST['secuencia'];
  $fecha_ini = $_POST['fecha_ini'];
  $fecha_fin = $_POST['fecha_fin'];

  $out = '';
  $result = '';

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.devuelve_fecha_fin_calendario(:empresa, :codigo_org_planta, :numero_simulacion, :orden_de_fabricacion, :secuencia, :fecha_ini, :fecha_fin); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":secuencia", $secuencia, 100);
  oci_bind_by_name($exec, ":fecha_ini", $fecha_ini, 100);
  oci_bind_by_name($exec, ":fecha_fin", $fecha_fin, 100);
  oci_bind_by_name($exec, ":result", $result, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}

//interna
function devuelve_fechas_iniciales() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];
  $secuencia = $_POST['secuencia'];
  $inicial_fecha_ini = $_POST['inicial_fecha_ini'];
  $inicial_fecha_fin = $_POST['inicial_fecha_fin'];

  $out = '';
  $result = '';

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.devuelve_fechas_iniciales(:empresa, :codigo_org_planta, :numero_simulacion, :orden_de_fabricacion, :secuencia, :inicial_fecha_ini, :inicial_fecha_fin); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":secuencia", $secuencia, 100);
  oci_bind_by_name($exec, ":inicial_fecha_ini", $inicial_fecha_ini, 100);
  oci_bind_by_name($exec, ":inicial_fecha_fin", $inicial_fecha_fin, 100);
  oci_bind_by_name($exec, ":result", $result, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function actualizar_fecha_fin() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $planta = $_POST['planta'];
  $simulacion = $_POST['simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];
  $secuencia = $_POST['secuencia'];
  $fecha_inicio = $_POST['fecha_inicio'];
  $duracion = $_POST['duracion'];

  $out = '';
  $result = '';

  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.actualizar_fecha_fin(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia, :fecha_inicio, :duracion); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":planta", $planta, 100);
  oci_bind_by_name($exec, ":simulacion", $simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":secuencia", $secuencia, 100);
  oci_bind_by_name($exec, ":fecha_inicio", $fecha_inicio, 100);
  oci_bind_by_name($exec, ":duracion", $duracion, 100);

  oci_bind_by_name($exec, ":result", $result, 1000);

  if (!oci_execute($exec)) {
    return oci_execute_error($exec);
  }

  $out = '"resultado":"OK", ' . $result . '';
  // $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function numero_secuencias_of() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $planta = $_POST['planta'];
  $simulacion = $_POST['simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];

  $out = '';
  $result = '';

  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.numero_secuencias_of(:empresa, :planta, :simulacion, :orden_de_fabricacion); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":planta", $planta, 100);
  oci_bind_by_name($exec, ":simulacion", $simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":result", $result, SQLT_INT);

  if (!oci_execute($exec)) {
    return oci_execute_error($exec);
  }

  $out = '"resultado":"OK","numero_secuencias_of":' . $result . '';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function get_fechas_secuencia() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $planta = $_POST['planta'];
  $simulacion = $_POST['simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];
  $secuencia = $_POST['secuencia'];

  $out = '';
  $result = '';

  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.get_fechas_secuencia(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":planta", $planta, 100);
  oci_bind_by_name($exec, ":simulacion", $simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":secuencia", $secuencia, 100);
  oci_bind_by_name($exec, ":result", $result, 100);

  if (!oci_execute($exec)) {
    return oci_execute_error($exec);
  }

  $fechas = explode(',', $result);
  $fecha_ini = $fechas[0];
  $fecha_fin = $fechas[1];
  $out = '"resultado":"OK","fecha_inicio":"' . $fecha_ini . '","fecha_fin":"' . $fecha_fin . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}