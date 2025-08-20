'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import React, { useState } from "react"
import { 
  Plus, 
  Trash2, 
  Copy,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap
} from "lucide-react"

interface Scenario {
  id: string
  name: string
  description: string
  probability: number
  actions: ScenarioAction[]
  assumptions: ScenarioAssumption[]
}

interface ScenarioAction {
  actionId: string
  actionCode: string
  actionDescription: string
  completionRate: number
  startDelay: number
  duration: number
  resourceRequirement: number
  successProbability: number
  dependencies: string[]
}

interface ScenarioAssumption {
  type: 'market' | 'resource' | 'external' | 'regulatory'
  name: string
  impact: number
  probability: number
  description: string
}

interface ScenarioBuilderProps {
  actions: any[]
  onScenariosChange: (scenarios: Scenario[]) => void
  scenarios: Scenario[]
}

export default function ScenarioBuilder({ 
  actions, 
  onScenariosChange, 
  scenarios 
}: ScenarioBuilderProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null)

  // Set active scenario when scenarios change
  React.useEffect(() => {
    if (scenarios.length > 0 && !activeScenario) {
      setActiveScenario(scenarios[0].id)
    }
  }, [scenarios, activeScenario])

  const addScenario = () => {
    const newScenario: Scenario = {
      id: `scenario_${Date.now()}`,
      name: `Senaryo ${scenarios.length + 1}`,
      description: '',
      probability: Math.max(0, 100 - scenarios.reduce((sum, s) => sum + s.probability, 0)),
      actions: [],
      assumptions: []
    }
    
    const updatedScenarios = [...scenarios, newScenario]
    onScenariosChange(updatedScenarios)
    setActiveScenario(newScenario.id)
  }

  const duplicateScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const newScenario: Scenario = {
      ...scenario,
      id: `scenario_${Date.now()}`,
      name: `${scenario.name} (Kopya)`,
      probability: 0
    }
    
    const updatedScenarios = [...scenarios, newScenario]
    onScenariosChange(updatedScenarios)
    setActiveScenario(newScenario.id)
  }

  const deleteScenario = (scenarioId: string) => {
    if (scenarios.length <= 1) return
    
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId)
    onScenariosChange(updatedScenarios)
    
    if (activeScenario === scenarioId) {
      setActiveScenario(updatedScenarios[0]?.id || null)
    }
  }

  const updateScenario = (scenarioId: string, updates: Partial<Scenario>) => {
    const updatedScenarios = scenarios.map(s => 
      s.id === scenarioId ? { ...s, ...updates } : s
    )
    onScenariosChange(updatedScenarios)
  }

  const addActionToScenario = (scenarioId: string, action: any) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const scenarioAction: ScenarioAction = {
      actionId: action.id,
      actionCode: action.code,
      actionDescription: action.description,
      completionRate: 75,
      startDelay: 0,
      duration: 30,
      resourceRequirement: 50,
      successProbability: 80,
      dependencies: []
    }

    const updatedActions = [...scenario.actions, scenarioAction]
    updateScenario(scenarioId, { actions: updatedActions })
  }

  const updateScenarioAction = (
    scenarioId: string, 
    actionId: string, 
    updates: Partial<ScenarioAction>
  ) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const updatedActions = scenario.actions.map(a => 
      a.actionId === actionId ? { ...a, ...updates } : a
    )
    updateScenario(scenarioId, { actions: updatedActions })
  }

  const removeActionFromScenario = (scenarioId: string, actionId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const updatedActions = scenario.actions.filter(a => a.actionId !== actionId)
    updateScenario(scenarioId, { actions: updatedActions })
  }

  const addAssumption = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const newAssumption: ScenarioAssumption = {
      type: 'market',
      name: 'Yeni Varsayım',
      impact: 0,
      probability: 50,
      description: ''
    }

    const updatedAssumptions = [...scenario.assumptions, newAssumption]
    updateScenario(scenarioId, { assumptions: updatedAssumptions })
  }

  const updateAssumption = (
    scenarioId: string, 
    index: number, 
    updates: Partial<ScenarioAssumption>
  ) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const updatedAssumptions = scenario.assumptions.map((a, i) => 
      i === index ? { ...a, ...updates } : a
    )
    updateScenario(scenarioId, { assumptions: updatedAssumptions })
  }

  const removeAssumption = (scenarioId: string, index: number) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    const updatedAssumptions = scenario.assumptions.filter((_, i) => i !== index)
    updateScenario(scenarioId, { assumptions: updatedAssumptions })
  }

  const currentScenario = scenarios.find(s => s.id === activeScenario)
  const totalProbability = scenarios.reduce((sum, s) => sum + s.probability, 0)
  const availableActions = currentScenario ? actions.filter(action => 
    !currentScenario.actions.some(sa => sa.actionId === action.id)
  ) : actions

  return (
    <div className="space-y-6">
      {/* Scenario Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Senaryo Yönetimi
              </CardTitle>
              <CardDescription>
                Farklı senaryolar oluşturun ve karşılaştırın
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={addScenario} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Senaryo Ekle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer ${
                  activeScenario === scenario.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span 
                  onClick={() => setActiveScenario(scenario.id)}
                  className="flex items-center gap-2 flex-1"
                >
                  {scenario.name}
                  <span className="text-xs opacity-75">({scenario.probability}%)</span>
                </span>
                {scenarios.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteScenario(scenario.id)
                    }}
                    className="ml-1 hover:text-red-300 p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Probability Validation */}
          <div className="mb-4">
            <div className={`flex items-center gap-2 text-sm ${
              Math.abs(totalProbability - 100) < 0.1 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(totalProbability - 100) < 0.1 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Toplam Olasılık: {totalProbability.toFixed(1)}%
              {Math.abs(totalProbability - 100) >= 0.1 && (
                <span className="ml-2">(%100 olmalı)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {currentScenario && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Senaryo Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Senaryo Adı</label>
                <input
                  type="text"
                  value={currentScenario.name}
                  onChange={(e) => updateScenario(currentScenario.id, { name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Açıklama</label>
                <textarea
                  value={currentScenario.description}
                  onChange={(e) => updateScenario(currentScenario.id, { description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Olasılık (%) - Mevcut: {currentScenario.probability}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentScenario.probability}
                  onChange={(e) => updateScenario(currentScenario.id, { probability: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => duplicateScenario(currentScenario.id)}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Kopyala
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Mevcut Eylemler
              </CardTitle>
              <CardDescription>
                Senaryoya eklemek için eylem seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {!currentScenario && (
                  <p className="text-sm text-yellow-600 text-center py-4">
                    Bir senaryo seçin
                  </p>
                )}
                {currentScenario && availableActions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Tüm eylemler senaryoya eklendi
                  </p>
                )}
                {currentScenario && actions.length === 0 && (
                  <p className="text-sm text-red-500 text-center py-4">
                    Hiç eylem yüklenmedi. Lütfen sayfayı yenileyin.
                  </p>
                )}
                {currentScenario && availableActions.map((action) => (
                  <div 
                    key={action.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addActionToScenario(currentScenario.id, action)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{action.code}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Ekle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scenario Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Senaryo Eylemleri ({currentScenario.actions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentScenario.actions.map((scenarioAction) => (
                  <div key={scenarioAction.actionId} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{scenarioAction.actionCode}</h4>
                        <p className="text-sm text-gray-600">{scenarioAction.actionDescription}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeActionFromScenario(currentScenario.id, scenarioAction.actionId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Tamamlanma (%) - {scenarioAction.completionRate}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scenarioAction.completionRate}
                          onChange={(e) => updateScenarioAction(
                            currentScenario.id, 
                            scenarioAction.actionId, 
                            { completionRate: Number(e.target.value) }
                          )}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Başarı Olasılığı (%) - {scenarioAction.successProbability}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scenarioAction.successProbability}
                          onChange={(e) => updateScenarioAction(
                            currentScenario.id, 
                            scenarioAction.actionId, 
                            { successProbability: Number(e.target.value) }
                          )}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Kaynak İhtiyacı (%) - {scenarioAction.resourceRequirement}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scenarioAction.resourceRequirement}
                          onChange={(e) => updateScenarioAction(
                            currentScenario.id, 
                            scenarioAction.actionId, 
                            { resourceRequirement: Number(e.target.value) }
                          )}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Başlama Gecikmesi (gün)</label>
                        <input
                          type="number"
                          min="0"
                          value={scenarioAction.startDelay}
                          onChange={(e) => updateScenarioAction(
                            currentScenario.id, 
                            scenarioAction.actionId, 
                            { startDelay: Number(e.target.value) }
                          )}
                          className="w-full p-1 border rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Süre (gün)</label>
                        <input
                          type="number"
                          min="1"
                          value={scenarioAction.duration}
                          onChange={(e) => updateScenarioAction(
                            currentScenario.id, 
                            scenarioAction.actionId, 
                            { duration: Number(e.target.value) }
                          )}
                          className="w-full p-1 border rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {currentScenario.actions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Bu senaryoya henüz eylem eklenmedi</p>
                    <p className="text-sm">Sağdaki listeden eylem seçin</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scenario Assumptions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Senaryo Varsayımları ({currentScenario.assumptions.length})
                </CardTitle>
                <Button onClick={() => addAssumption(currentScenario.id)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Varsayım Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentScenario.assumptions.map((assumption, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Varsayım Adı</label>
                        <input
                          type="text"
                          value={assumption.name}
                          onChange={(e) => updateAssumption(
                            currentScenario.id, 
                            index, 
                            { name: e.target.value }
                          )}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Tür</label>
                        <select
                          value={assumption.type}
                          onChange={(e) => updateAssumption(
                            currentScenario.id, 
                            index, 
                            { type: e.target.value as any }
                          )}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="market">Pazar</option>
                          <option value="resource">Kaynak</option>
                          <option value="external">Dış Faktör</option>
                          <option value="regulatory">Düzenleyici</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Etki (%) - {assumption.impact}%
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={assumption.impact}
                          onChange={(e) => updateAssumption(
                            currentScenario.id, 
                            index, 
                            { impact: Number(e.target.value) }
                          )}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Olasılık (%) - {assumption.probability}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={assumption.probability}
                          onChange={(e) => updateAssumption(
                            currentScenario.id, 
                            index, 
                            { probability: Number(e.target.value) }
                          )}
                          className="w-full"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-1">Açıklama</label>
                            <input
                              type="text"
                              value={assumption.description}
                              onChange={(e) => updateAssumption(
                                currentScenario.id, 
                                index, 
                                { description: e.target.value }
                              )}
                              className="w-full p-2 border rounded text-sm"
                              placeholder="Varsayım hakkında detay..."
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAssumption(currentScenario.id, index)}
                            className="mt-5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {currentScenario.assumptions.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Bu senaryoya varsayım eklenmedi</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
