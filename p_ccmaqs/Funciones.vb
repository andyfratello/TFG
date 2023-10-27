Public Class Funciones

    Public Function getcadenaconexion() As String
        Dim constring As String = "Provider=msdaora;Data Source=" & Form1.source & ";User Id=" & Form1.user & ";Password=" & Form1.passw & ";"
        Return constring
    End Function
    Public Function getcadenaconexion_oracleclient() As String
        Dim constring As String = "Data Source=" & Form1.source & ";Persist Security Info=True;Password=" & Form1.passw & ";User ID=" & Form1.user & ""
        Return constring
    End Function
    Public Sub cargar_BD(ByVal Gantt As Steema.TeeChart.Styles.Gantt, ByVal dataset As System.Data.DataTable)
        'Dim i As Integer
        'For i = 0 To dataset.Rows.Count - 1
        '    MessageBox.Show("posicion: " & dataset.Rows(i).Item("Y").ToString & "siguiente: " & dataset.Rows(i).Item("NEXTTASK").ToString)
        'Next
        'Asigno los origenes de datos al gráfico

        ' MessageBox.Show("Inicio cargar_bd")

        Gantt.DataSource = dataset
        Gantt.YValues.DataMember = dataset.Columns("Y").ToString
        Gantt.StartValues.DataMember = dataset.Columns("FECHA_INI").ToString
        Gantt.EndValues.DataMember = dataset.Columns("FECHA_FIN").ToString
        Gantt.NextTasks.DataMember = dataset.Columns("NEXTTASK").ToString
        Gantt.LabelMember = dataset.Columns("RECURSO").ToString
        'Gantt.ColorMember = dataset.Columns("COLOR").ToString
        ' Gantt.ColorMember = Color.Aqua.ToString
        'MessageBox.Show(Color.Aqua.ToString)

        ' MessageBox.Show("data source asignado cargar_bd")


    End Sub
    Public Sub cambiar_aspecto(ByVal Tchart As Steema.TeeChart.TChart)
        If Tchart.Aspect.View3D = False Then
            Tchart.Aspect.View3D = True
            Tchart.Aspect.Chart3DPercent = 5
        Else
            Tchart.Aspect.View3D = False
        End If
    End Sub
    Public Sub configuracion(ByVal Gantt As Steema.TeeChart.Styles.Gantt)
        'Muestro el panel de configuración del gráfico
        Steema.TeeChart.Editors.SeriesEditor.ShowEditor(Gantt)
    End Sub
    Public Sub tabla_colores(ByVal tabla As DataTable, ByVal seleccion As Integer)
        Dim filas, cuantos, contador As Integer
        Dim myconn As New OleDb.OleDbConnection(getcadenaconexion())
        myconn.Open()
        Dim mycmd As New OleDb.OleDbCommand
        mycmd.Connection = myconn
        mycmd.CommandText = "delete from sch_grafico_colores"
        mycmd.ExecuteNonQuery()
        filas = tabla.Rows.Count - 1
        contador = 0
        If seleccion = 0 Then
            For i = 0 To filas
                mycmd.CommandText = "Select count(*) from sch_grafico_colores where orden_de_fabricacion = " & tabla.Rows(i).Item("ORDEN_DE_FABRICACION")
                cuantos = mycmd.ExecuteScalar()
                If cuantos = 0 Then
                    mycmd.CommandText = "insert into sch_grafico_colores (orden_de_fabricacion, color) values(" & tabla.Rows(i).Item("ORDEN_DE_FABRICACION") & "," & contador & ")"
                    contador = contador + 1
                    mycmd.ExecuteNonQuery()
                End If
            Next
        ElseIf seleccion = 3 Then
            For i = 0 To filas
                mycmd.CommandText = "Select count(*) from sch_grafico_colores where orden_de_fabricacion = '" & tabla.Rows(i).Item("PROYECTO") & "'"
                cuantos = mycmd.ExecuteScalar()
                If cuantos = 0 Then
                    mycmd.CommandText = "insert into sch_grafico_colores (ORDEN_DE_FABRICACION, COLOR, ID_SESION) values('" & tabla.Rows(i).Item("PROYECTO") & "'," & contador & "," & Form1.id_sesion & ")"
                    contador = contador + 1
                    mycmd.ExecuteNonQuery()
                End If
            Next
        End If
        If seleccion = 5 Then
            For i = 0 To filas
                mycmd.CommandText = "Select count(*) from sch_grafico_colores where orden_de_fabricacion = '" & tabla.Rows(i).Item("RESERVADOA01") & "'"
                cuantos = mycmd.ExecuteScalar()
                If cuantos = 0 Then
                    mycmd.CommandText = "insert into sch_grafico_colores (ORDEN_DE_FABRICACION, COLOR, ID_SESION) values('" & tabla.Rows(i).Item("RESERVADOA01") & "'," & contador & "," & Form1.id_sesion & ")"
                    contador = contador + 1
                    mycmd.ExecuteNonQuery()
                End If
            Next
        End If
    End Sub

    Public Sub pintar_barras(ByVal gantt As Steema.TeeChart.Styles.Gantt, ByVal seleccion As Integer, ByVal tabla As System.Data.DataTable, ByVal grid As DataGridView, ByVal pintar As Boolean)


        If (seleccion = 0 Or seleccion = 3) And pintar = True Then 'Or seleccion = 5) 
            'Pintamos cada linea del gráfico de color distinto
            Dim myconn As New OleDb.OleDbConnection(getcadenaconexion())
            myconn.Open()
            Dim mycmd As New OleDb.OleDbCommand
            mycmd.Connection = myconn
            Dim colores(2000) As System.Drawing.Color
            Dim filas As Integer
            Dim posicion_color As Integer

            colores(0) = Color.DarkOrange
            colores(1) = Color.DarkSeaGreen
            colores(2) = Color.DeepSkyBlue
            colores(3) = Color.Firebrick
            colores(4) = Color.DarkRed
            colores(5) = Color.DarkOrchid
            colores(6) = Color.Gold
            colores(7) = Color.DodgerBlue
            colores(8) = Color.DarkSeaGreen
            colores(9) = Color.Blue
            colores(10) = Color.BlueViolet
            colores(11) = Color.Brown
            colores(12) = Color.BurlyWood
            colores(13) = Color.CadetBlue
            colores(14) = Color.Chartreuse
            colores(15) = Color.Chocolate
            colores(16) = Color.Coral
            colores(17) = Color.CornflowerBlue
            colores(18) = Color.Cornsilk
            colores(19) = Color.Crimson
            colores(20) = Color.Lime
            colores(21) = Color.MediumVioletRed
            colores(22) = Color.MintCream
            colores(23) = Color.OrangeRed
            colores(24) = Color.Purple
            colores(25) = Color.Silver
            colores(26) = Color.Wheat

            filas = tabla.Rows.Count - 1



            If seleccion = 0 Then
                For i = 0 To filas

                    mycmd.CommandText = "select color from sch_grafico_colores where orden_de_fabricacion = " & tabla.Rows(i).Item("ORDEN_DE_FABRICACION")
                    posicion_color = mycmd.ExecuteScalar()
                    gantt.Colors(i) = colores(posicion_color)
                Next
            ElseIf seleccion = 3 Then

                For i = 0 To filas
                    mycmd.CommandText = "select color from sch_grafico_colores where orden_de_fabricacion = '" & tabla.Rows(i).Item("PROYECTO") & "'"
                    posicion_color = mycmd.ExecuteScalar()
                    gantt.Colors(i) = colores(posicion_color)
                Next
                'ElseIf seleccion = 5 Then

                '    For i = 0 To filas
                '        mycmd.CommandText = "select color from sch_grafico_colores where orden_de_fabricacion = '" & tabla.Rows(i).Item("RESERVADOA01") & "'"
                '        posicion_color = mycmd.ExecuteScalar()
                '        gantt.Colors(i) = colores(posicion_color)
                '    Next

            End If

            Try
                gantt.Draw()
            Catch ex As Exception
            End Try

        End If

 

        'Marcamos con colores la OF seleccionada
        If seleccion = 1 Then
            Dim filas As Integer
            Dim actual As Integer
            actual = grid.CurrentCell.RowIndex
            filas = tabla.Rows.Count - 1
            Try
                For i = 0 To filas
                    If tabla.Rows(i).Item("ORDEN_DE_FABRICACION") = tabla.Rows(actual).Item("ORDEN_DE_FABRICACION") Then
                        gantt.Colors(i) = System.Drawing.Color.FromArgb(50, 250, 50)
                    Else
                        gantt.Colors(i) = System.Drawing.Color.FromArgb(180, 250, 180)
                    End If
                Next

                gantt.Draw()
            Catch EX As Exception
            End Try
        End If
        If seleccion = 4 Then
            Dim filas, contar As Integer
            Dim actual As Integer
            Dim myconn As New OleDb.OleDbConnection(getcadenaconexion())
            myconn.Open()
            Dim mycmd As New OleDb.OleDbCommand
            Dim fecha_ini_aux, fecha_fin_aux As String

            mycmd.Connection = myconn
            actual = grid.CurrentCell.RowIndex
            filas = tabla.Rows.Count - 1
            Try
                For i = 0 To filas
                    fecha_ini_aux = tabla.Rows(i).Item("FECHA_INI")
                    fecha_fin_aux = tabla.Rows(i).Item("FECHA_FIN")

                    fecha_ini_aux = Trim(fecha_ini_aux.Substring(0, InStr(fecha_ini_aux & " ", " ") - 1))
                    fecha_fin_aux = Trim(fecha_fin_aux.Substring(0, InStr(fecha_fin_aux & " ", " ") - 1))


                    mycmd.CommandText = "select count(*) from sch_grafico_carga_recursos where ID_SESION = " & Form1.id_sesion & " and porcentaje_carga > 100 and fecha >= TO_DATE('" & fecha_ini_aux & "','" & Form1.nls_date_format & "') and FECHA <= TO_DATE('" & fecha_fin_aux & "','" & Form1.nls_date_format & "') and recurso = (SELECT RECURSO FROM SCH_GRAFICO_RECURSOS WHERE SECUENCIA = " & tabla.Rows(i).Item("SECUENCIA") & " AND ORDEN_DE_FABRICACION = " & tabla.Rows(i).Item("ORDEN_DE_FABRICACION") & " AND NUMERO_SIMULACION = '" & tabla.Rows(i).Item("NUMERO_SIMULACION") & "' AND CODIGO_ORG_PLANTA = '" & tabla.Rows(i).Item("CODIGO_ORG_PLANTA") & "' AND CODIGO_EMPRESA = '" & tabla.Rows(i).Item("CODIGO_EMPRESA") & "' AND ID_SESION = " & Form1.id_sesion & ")"
                    contar = mycmd.ExecuteScalar

                    If tabla.Rows(i).Item("ORDEN_DE_FABRICACION") = tabla.Rows(actual).Item("ORDEN_DE_FABRICACION") Then
                        gantt.Colors(i) = System.Drawing.Color.FromArgb(50, 250, 50)
                        If contar > 0 Then
                            gantt.Colors(i) = System.Drawing.Color.FromArgb(250, 50, 50)
                        End If
                    Else
                        gantt.Colors(i) = System.Drawing.Color.FromArgb(180, 250, 180)
                        If contar > 0 Then
                            gantt.Colors(i) = System.Drawing.Color.FromArgb(250, 180, 180)
                        End If
                    End If
                Next

                gantt.Draw()
            Catch EX As Exception
            End Try
        End If
        If seleccion = 2 Then
            Dim filas As Integer
            Dim actual As Integer
            actual = grid.CurrentCell.RowIndex
            filas = tabla.Rows.Count - 1

            For i = 0 To filas
                If tabla.Rows(i).Item("PORC_COMPLETADO") = 0 Then
                    gantt.Colors(i) = System.Drawing.Color.FromArgb(180, 250, 180)
                ElseIf tabla.Rows(i).Item("PORC_COMPLETADO") >= 100 Then
                    gantt.Colors(i) = System.Drawing.Color.FromArgb(250, 180, 180)
                ElseIf tabla.Rows(i).Item("PORC_COMPLETADO") > 0 Then
                    gantt.Colors(i) = System.Drawing.Color.FromArgb(250, 250, 180)
                End If
            Next
            Try
                gantt.Draw()
            Catch EX As Exception
            End Try
        End If

        If seleccion = 5 Then 'plazo entrega
            Dim myconn As New OleDb.OleDbConnection(getcadenaconexion())
            myconn.Open()
            Dim mycmd As New OleDb.OleDbCommand
            mycmd.Connection = myconn
            Dim filas, contar As Integer
            Dim fecha_ini_aux, fecha_fin_aux As String

            filas = tabla.Rows.Count - 1
            For i = 0 To filas
                Try
                    fecha_ini_aux = tabla.Rows(i).Item("FECHA_INI")
                    fecha_fin_aux = tabla.Rows(i).Item("FECHA_FIN")

                    fecha_ini_aux = Trim(fecha_ini_aux.Substring(0, InStr(fecha_ini_aux & " ", " ") - 1))
                    fecha_fin_aux = Trim(fecha_fin_aux.Substring(0, InStr(fecha_fin_aux & " ", " ") - 1))

                    mycmd.CommandText = "select count(*) from sch_of_cab where fecha_entrega_prevista < TO_DATE('" & fecha_fin_aux & "','" & Form1.nls_date_format & "') and ORDEN_DE_FABRICACION = " & tabla.Rows(i).Item("ORDEN_DE_FABRICACION") & " AND CODIGO_SIMULACION = '" & tabla.Rows(i).Item("NUMERO_SIMULACION") & "' AND CODIGO_ORG_PLANTA = '" & tabla.Rows(i).Item("CODIGO_ORG_PLANTA") & "' AND CODIGO_EMPRESA = '" & tabla.Rows(i).Item("CODIGO_EMPRESA") & "'"
                    contar = mycmd.ExecuteScalar
                    If contar > 0 Then
                        gantt.Colors(i) = System.Drawing.Color.FromArgb(250, 50, 50)
                    Else
                        gantt.Colors(i) = System.Drawing.Color.FromArgb(50, 250, 50)
                    End If
                Catch ex As Exception
                End Try

            Next

            Try
                gantt.Draw()
            Catch ex As Exception
            End Try
        End If
    End Sub

    Public Sub separacion_barras(ByVal tchart As Steema.TeeChart.TChart, ByVal valor As Integer)
        tchart.Axes.Left.MaximumOffset = valor * -1
        tchart.Axes.Left.MinimumOffset = valor * -1
    End Sub

    Public Sub offset_grafico(ByVal tchart As Steema.TeeChart.TChart, ByVal opcion As Integer, ByVal tabla As DataTable, ByVal valor As Integer)
        If opcion = 0 Then
            tchart.Axes.Left.MaximumOffset = valor * -1
            tchart.Axes.Left.MinimumOffset = valor * -1
        Else
            tchart.Axes.Left.MaximumOffset = -tabla.Rows.Count
            tchart.Axes.Left.MinimumOffset = -tabla.Rows.Count
        End If
    End Sub

    Public Sub Mostrar_Marcas(ByVal tabla As Data.DataTable, ByVal series As Steema.TeeChart.Styles.Series, ByVal e As Steema.TeeChart.Styles.GetSeriesMarkEventArgs, ByVal opcion As Integer)

        Try
            If opcion = 1 Then
                e.MarkText = tabla.Rows(e.ValueIndex).Item("PORC_COMPLETADO")
            ElseIf opcion = 2 Then
                e.MarkText = tabla.Rows(e.ValueIndex).Item("ORDEN_DE_FABRICACION") & "/" & tabla.Rows(e.ValueIndex).Item("FASE")
            ElseIf opcion = 3 Then
                e.MarkText = tabla.Rows(e.ValueIndex).Item("DESC_ARTICULO")
            ElseIf opcion = 4 Then
                e.MarkText = tabla.Rows(e.ValueIndex).Item("DESC_RECURSO")
            ElseIf opcion = 5 Then
                e.MarkText = Strings.FormatDateTime(tabla.Rows(e.ValueIndex).Item("FECHA_INI"), DateFormat.ShortDate) & " - " & Strings.FormatDateTime(tabla.Rows(e.ValueIndex).Item("FECHA_FIN"), DateFormat.ShortDate)
            ElseIf opcion = 6 Then
                If tabla.Rows(e.ValueIndex).Item("NEXTTASK") = ("-1") Then

                    e.MarkText = tabla.Rows(e.ValueIndex).Item("DESC_CLIENTE")
                Else
                    e.MarkText = ""
                End If
                'ElseIf opcion = 7 Then
                '    e.MarkText = tabla.Rows(e.ValueIndex).Item("RESERVADOA01")
            End If
        Catch ex As InvalidCastException
            e.MarkText = ""
        End Try
    End Sub
    Public Sub Dia_semana(ByVal fecha As Date, ByVal dia As Integer, ByVal etiqueta As Label, ByVal fecha_fin As Date, ByVal dia_fin As Integer)

        If dia = 0 Then
            etiqueta.Text = fecha & "  Do   "
        ElseIf dia = 1 Then
            etiqueta.Text = fecha & "  Lu   "
        ElseIf dia = 2 Then
            etiqueta.Text = fecha & "  Ma   "
        ElseIf dia = 3 Then
            etiqueta.Text = fecha & "  Mi   "
        ElseIf dia = 4 Then
            etiqueta.Text = fecha & "  Ju   "
        ElseIf dia = 5 Then
            etiqueta.Text = fecha & "  Vi   "
        ElseIf dia = 6 Then
            etiqueta.Text = fecha & "  Sa   "
        End If



        If dia_fin = 0 Then
            etiqueta.Text = etiqueta.Text + fecha_fin & "  Do"
        ElseIf dia_fin = 1 Then
            etiqueta.Text = etiqueta.Text + fecha_fin & "  Lu"
        ElseIf dia_fin = 2 Then
            etiqueta.Text = etiqueta.Text + fecha_fin & "  Ma"
        ElseIf dia_fin = 3 Then
            etiqueta.Text = etiqueta.Text + fecha_fin & "  Mi"
        ElseIf dia_fin = 4 Then
            etiqueta.Text = etiqueta.Text + fecha_fin & "  Ju"
        ElseIf dia_fin = 5 Then
            etiqueta.Text = etiqueta.Text + fecha_fin & "  Vi"
        ElseIf dia_fin = 6 Then
            etiqueta.Text = etiqueta.Text + fecha_fin & "  Sa"
        End If


    End Sub

    Function GetCommandLineArgs() As String()
        ' Declare variables.
        Dim separators As String = " "
        Dim commands As String = Microsoft.VisualBasic.Command()
        Dim args() As String = commands.Split(separators.ToCharArray)
        Return args
    End Function




End Class
